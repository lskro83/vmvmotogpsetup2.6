// --- SUPABASE CONFIG ---
const SUPABASE_URL = "https://glovvrsctvjwjtxiaaihu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsb3Z2c2N0dmp3anR4aWFpahuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzAxNTUsImV4cCI6MjEwNjQ0NjE1NX0.CcPT-QFfF3mQrH9KxnOpU9Adu4ltCV5FrH4lWULR3Vk";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- GESTION PROPRE DES ONGLETS ---
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        const clickedTab = e.currentTarget;
        clickedTab.classList.add('active');
        
        const targetId = 'tab-' + clickedTab.id.replace('btn-', '');
        const targetEl = document.getElementById(targetId);
        if(targetEl) {
            targetEl.classList.add('active');
        }
        
        if(targetId === 'tab-setups') {
            chargerSetups();
        }
    });
});

// --- PROFIL & SESSION LOCALE ---
let pseudoActif = localStorage.getItem('vmv_pseudo') || '';
const pseudoInput = document.getElementById('pseudoActifInput');
const btnToggleProfil = document.getElementById('btnToggleProfil');
const statutSession = document.getElementById('statutSession');
const auteurInput = document.getElementById('auteurInput');

function refreshProfilUI() {
    if(!pseudoInput || !btnToggleProfil || !statutSession) return;
    if(pseudoActif) {
        pseudoInput.value = pseudoActif;
        if(auteurInput) auteurInput.value = pseudoActif;
        statutSession.innerText = "Statut : Connecté en tant que " + pseudoActif;
        btnToggleProfil.innerText = "Se déconnecter";
        btnToggleProfil.style.background = "#0d8a3e";
    } else {
        statutSession.innerText = "Statut : Déconnecté";
        btnToggleProfil.innerText = "Se connecter";
        btnToggleProfil.style.background = "#ff3333";
    }
}
refreshProfilUI();

if(btnToggleProfil) {
    btnToggleProfil.addEventListener('click', () => {
        if(pseudoActif) {
            if(confirm("Voulez-vous vous déconnecter ?")) {
                pseudoActif = '';
                localStorage.removeItem('vmv_pseudo');
                refreshProfilUI();
            }
        } else {
            const val = pseudoInput.value.trim();
            if(val) {
                pseudoActif = val;
                localStorage.setItem('vmv_pseudo', pseudoActif);
                refreshProfilUI();
                alert("Connecté avec succès !");
            } else {
                alert("Veuillez entrer un pseudo valide.");
            }
        }
    });
}

// --- PARTAGE DE SETUP SUR SUPABASE ---
const formSetup = document.getElementById('formSetup');
if(formSetup) {
    formSetup.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!pseudoActif) {
            alert("Veuillez vous connecter avec un pseudo dans l'onglet Profil avant de publier !");
            return;
        }

        const payload = {
            auteur: auteurInput.value,
            moto: document.getElementById('motoInput').value,
            circuit: document.getElementById('circuitNomInput').value,
            pneu_avant: document.getElementById('pneuAvant').value,
            pneu_arriere: document.getElementById('pneuArriere').value,
            susp_av_pre: parseInt(document.getElementById('suspAvPre').value) || 4,
            susp_av_hui: parseInt(document.getElementById('suspAvHui').value) || 4,
            susp_av_res: parseInt(document.getElementById('suspAvRes').value) || 4,
            susp_av_com: parseInt(document.getElementById('suspAvCom').value) || 4,
            susp_av_ext: parseInt(document.getElementById('suspAvExt').value) || 4,
            susp_ar_pre: parseInt(document.getElementById('suspArPre').value) || 4,
            susp_ar_res: parseInt(document.getElementById('suspArRes').value) || 4,
            susp_ar_cl: parseInt(document.getElementById('suspArCL').value) || 4,
            susp_ar_cr: parseInt(document.getElementById('suspArCR').value) || 4,
            susp_ar_ext: parseInt(document.getElementById('suspArExt').value) || 4,
            bv_1: parseInt(document.getElementById('bv1').value) || 4,
            bv_2: parseInt(document.getElementById('bv2').value) || 4,
            bv_3: parseInt(document.getElementById('bv3').value) || 4,
            bv_4: parseInt(document.getElementById('bv4').value) || 4,
            bv_5: parseInt(document.getElementById('bv5').value) || 4,
            bv_6: parseInt(document.getElementById('bv6').value) || 4,
            bv_final: parseInt(document.getElementById('bvFinal').value) || 4,
            anti_dribble: parseInt(document.getElementById('antiDribble').value) || 4,
            frein_avant: document.getElementById('freinAvant').value,
            frein_arriere: document.getElementById('freinArriere').value,
            ecu_tcs: parseInt(document.getElementById('ecuTcs').value) || 3,
            ecu_aw: parseInt(document.getElementById('ecuAw').value) || 3,
            ecu_ebs: parseInt(document.getElementById('ecuEbs').value) || 3,
            geo_cha: parseInt(document.getElementById('geoCha').value) || 4,
            geo_dep: parseInt(document.getElementById('geoDep').value) || 4,
            geo_pla: parseInt(document.getElementById('geoPla').value) || 4,
            geo_bra: parseInt(document.getElementById('geoBra').value) || 4
        };

        console.log("Envoi du payload vers Supabase :", payload);

        const { error } = await supabaseClient.from('motogp_setups').insert([payload]);
        if(error) {
            console.error("Erreur Supabase :", error);
            alert("Erreur lors de l'enregistrement : " + error.message);
        } else {
            alert("Setup partagé avec succès sur le Cloud !");
            document.getElementById('btn-setups').click();
        }
    });
}

// --- CHARGEMENT ET FILTRAGE DES SETUPS ---
let allSetupsCache = [];

async function chargerSetups() {
    const container = document.getElementById('listeSetups');
    if(!container) return;
    container.innerHTML = "Chargement en cours...";
    
    const { data, error } = await supabaseClient.from('motogp_setups').select('*').order('created_at', { ascending: false });
    if(error) {
        container.innerHTML = "Erreur de chargement : " + error.message;
        return;
    }
    allSetupsCache = data || [];
    afficherSetupsFiltres();
}

function afficherSetupsFiltres() {
    const container = document.getElementById('listeSetups');
    if(!container) return;
    const filtreTexte = document.getElementById('filtreInput').value.toLowerCase();
    const filtreCircuit = document.getElementById('filtreCircuitSelect').value;

    const filtres = allSetupsCache.filter(item => {
        const matchTexte = (item.moto && item.moto.toLowerCase().includes(filtreTexte)) || 
                           (item.auteur && item.auteur.toLowerCase().includes(filtreTexte));
        const matchCircuit = !filtreCircuit || item.circuit === filtreCircuit;
        return matchTexte && matchCircuit;
    });

    if(filtres.length === 0) {
        container.innerHTML = "<p style='color:#777; font-size:11px; text-align:center;'>Aucun setup trouvé.</p>";
        return;
    }

    container.innerHTML = '';
    filtres.forEach(item => {
        const div = document.createElement('div');
        div.className = 'setup-item';
        div.innerHTML = `<strong>${item.moto}</strong> sur <strong>${item.circuit}</strong><br><span style="font-size:10px; color:#888;">Par ${item.auteur}</span>`;
        div.addEventListener('click', () => ouvrirModalSetup(item));
        container.appendChild(div);
    });
}

const filtreInput = document.getElementById('filtreInput');
const filtreCircuitSelect = document.getElementById('filtreCircuitSelect');
if(filtreInput) filtreInput.addEventListener('input', afficherSetupsFiltres);
if(filtreCircuitSelect) filtreCircuitSelect.addEventListener('change', afficherSetupsFiltres);

// --- MODALE DETAIL ---
const modal = document.getElementById('modalDetails');
const btnCloseModal = document.getElementById('btnCloseModal');
if(btnCloseModal && modal) {
    btnCloseModal.addEventListener('click', () => modal.style.display = 'none');
}

function ouvrirModalSetup(item) {
    document.getElementById('modalTitre').innerText = `${item.moto} (${item.circuit})`;
    document.getElementById('modalCorps').innerHTML = `
        <p><strong>Auteur :</strong> ${item.auteur}</p>
        <div class="section-title">Pneumatiques</div>
        Avant : ${item.pneu_avant} | Arrière : ${item.pneu_arriere}
        <div class="section-title">Suspension Avant</div>
        Précharge : ${item.susp_av_pre} | Huile : ${item.susp_av_hui} | Ressort : ${item.susp_av_res}<br>
        Compression : ${item.susp_av_com} | Extension : ${item.susp_av_ext}
        <div class="section-title">Suspension Arrière</div>
        Précharge : ${item.susp_ar_pre} | Ressort : ${item.susp_ar_res} | Comp. Lente : ${item.susp_ar_cl}<br>
        Comp. Rapide : ${item.susp_ar_cr} | Extension : ${item.susp_ar_ext}
        <div class="section-title">Boîte de Vitesse</div>
        1ère: ${item.bv_1} | 2ème: ${item.bv_2} | 3ème: ${item.bv_3} | 4ème: ${item.bv_4} | 5ème: ${item.bv_5} | 6ème: ${item.bv_6}<br>
        Rapport Final : ${item.bv_final} | Anti-dribble : ${item.anti_dribble}
        <div class="section-title">Freins & Électronique</div>
        Frein Av : ${item.frein_avant} | Frein Ar : ${item.frein_arriere}<br>
        TCS : ${item.ecu_tcs} | Anti-Wheelie : ${item.ecu_aw} | Frein Moteur : ${item.ecu_ebs}
        <div class="section-title">Géométrie</div>
        Chasse : ${item.geo_cha} | Déport : ${item.geo_dep} | Plaque : ${item.geo_pla} | Bras : ${item.geo_bra}
    `;
    if(modal) modal.style.display = 'flex';
}

// --- COACH IA LOGIQUE ---
const btnCoachRapide = document.getElementById('btnCoachRapide');
const btnCoachComplet = document.getElementById('btnCoachComplet');
if(btnCoachRapide && btnCoachComplet) {
    btnCoachRapide.addEventListener('click', () => {
        btnCoachRapide.classList.add('active');
        btnCoachComplet.classList.remove('active');
        document.getElementById('viewCoachRapide').classList.add('active');
        document.getElementById('viewCoachComplet').classList.remove('active');
    });

    btnCoachComplet.addEventListener('click', () => {
        btnCoachComplet.classList.add('active');
        btnCoachRapide.classList.remove('active');
        document.getElementById('viewCoachComplet').classList.add('active');
        document.getElementById('viewCoachRapide').classList.remove('active');
    });
}

const problemesParPhase = {
    "Entree": [
        { id: "blocage", texte: "Blocage de la roue arrière ou dribble au rétrogradage", conseil: "Augmenter l'anti-dribble de l'embrayage ou durcir le frein moteur (EBS) d'un cran." },
        { id: "sous_virage_entree", texte: "La moto refuse de tourner à l'inscription (élargit)", conseil: "Diminuer la précharge avant ou augmenter légèrement le déport pour accentuer l'agilité." },
        { id: "instabilite_freinage", texte: "Guidonnage ou gros manque de stabilité en bout de ligne droite", conseil: "Raffermir la compression avant et augmenter la précharge arrière pour garder l'assiette." }
    ],
    "Milieu": [
        { id: "perte_avant", texte: "Sensation de décrochage sur l'angle maximum (train avant fuyant)", conseil: "Passer sur un pneu avant plus dur (Hard) ou assouplir l'extension avant pour coller la gomme." },
        { id: "traj_large", texte: "Impossible de tenir la corde au milieu du virage", conseil: "Augmenter l'angle de chasse ou raffermir la compression lente à l'arrière." }
    ],
    "Sortie": [
        { id: "patinage_sortie", texte: "Patinage massif de la roue arrière à la remise des gaz", conseil: "Augmenter le TCS (Traction Control) de 1 point ou assouplir la compression rapide arrière." },
        { id: "pompage_squat", texte: "La moto s'écrase violemment de l'arrière (pompage)", conseil: "Augmenter la précharge du ressort arrière et fermer l'extension arrière d'un tour." }
    ]
};

const phaseSelect = document.getElementById('phaseSelect');
const problemeSelect = document.getElementById('problemeSelect');
const conseilBox = document.getElementById('conseilBox');

function majProblemes() {
    if(!phaseSelect || !problemeSelect) return;
    const phase = phaseSelect.value;
    const liste = problemesParPhase[phase] || [];
    problemeSelect.innerHTML = '';
    liste.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.innerText = p.texte;
        problemeSelect.appendChild(opt);
    });
    majConseil();
}

function majConseil() {
    if(!phaseSelect || !problemeSelect || !conseilBox) return;
    const phase = phaseSelect.value;
    const liste = problemesParPhase[phase] || [];
    const selectedObj = liste.find(p => p.id === problemeSelect.value);
    conseilBox.innerText = selectedObj ? selectedObj.conseil : "Sélectionne un problème.";
}

if(phaseSelect) phaseSelect.addEventListener('change', majProblemes);
if(problemeSelect) problemeSelect.addEventListener('change', majConseil);
majProblemes();

// --- GÉNÉRATEUR EXTRÊME : SETUP COMPLET DE A À Z ---
const btnGenererSetupAI = document.getElementById('btnGenererSetupAI');
if(btnGenererSetupAI) {
    btnGenererSetupAI.addEventListener('click', () => {
        const circuit = document.getElementById('aiCircuitNom').value;
        const meteo = document.getElementById('aiMeteo').value;
        const checkedProbs = Array.from(document.querySelectorAll('input[name="probMulti"]:checked')).map(el => el.value);

        let setup = {
            pneu_avant: meteo.includes('Humide') ? "Soft (Pluie)" : "Medium",
            pneu_arriere: meteo.includes('Humide') ? "Soft (Pluie)" : "Medium",
            susp_av_pre: 4, susp_av_hui: 4, susp_av_res: 4, susp_av_com: 4, susp_av_ext: 4,
            susp_ar_pre: 4, susp_ar_res: 4, susp_ar_cl: 4, susp_ar_cr: 4, susp_ar_ext: 4,
            bv_1: 4, bv_2: 4, bv_3: 4, bv_4: 4, bv_5: 4, bv_6: 4, bv_final: 4, anti_dribble: 4,
            frein_avant: "340mm Standard", frein_arriere: "220mm Standard",
            ecu_tcs: 3, ecu_aw: 3, ecu_ebs: 3,
            geo_cha: 4, geo_dep: 4, geo_pla: 4, geo_bra: 4
        };

        checkedProbs.forEach(p => {
            if(p === 'stabilite') {
                setup.susp_av_com = Math.min(7, setup.susp_av_com + 2);
                setup.susp_ar_pre = Math.min(7, setup.susp_ar_pre + 1);
            }
            if(p === 'pivoter') {
                setup.geo_cha = Math.max(1, setup.geo_cha - 1);
                setup.susp_av_ext = Math.min(7, setup.susp_av_ext + 1);
            }
            if(p === 'patinage') {
                setup.ecu_tcs = Math.min(5, setup.ecu_tcs + 1);
                setup.susp_ar_cr = Math.max(1, setup.susp_ar_cr - 1);
            }
            if(p === 'elargit') {
                setup.susp_ar_ext = Math.min(7, setup.susp_ar_ext + 1);
                setup.bv_final = Math.min(7, setup.bv_final + 1);
            }
            if(p === 'pompage') {
                setup.susp_ar_res = Math.min(7, setup.susp_ar_res + 2);
                setup.susp_ar_cl = Math.min(7, setup.susp_ar_cl + 1);
            }
            if(p === 'blocage_arriere') {
                setup.anti_dribble = Math.min(7, setup.anti_dribble + 2);
                setup.ecu_ebs = Math.min(5, setup.ecu_ebs + 1);
            }
        });

        let htmlResultat = `<strong style="color:#ff3333; font-size:13px;">🎯 SETUP EXTRÊME GÉNÉRÉ - ${circuit} (${meteo})</strong><br><br>`;
        htmlResultat += `<div style="font-size:11px; color:#aaa; margin-bottom:8px;">Ajusté automatiquement par l'IA selon vos critères.</div>`;
        
        htmlResultat += `<div class="section-title">Pneumatiques</div>`;
        htmlResultat += `Avant : <strong>${setup.pneu_avant}</strong> | Arrière : <strong>${setup.pneu_arriere}</strong>`;
        
        htmlResultat += `<div class="section-title">Suspension Avant (1 à 7)</div>`;
        htmlResultat += `Précharge : ${setup.susp_av_pre} | Huile : ${setup.susp_av_hui} | Ressort : ${setup.susp_av_res}<br>`;
        htmlResultat += `Compression : ${setup.susp_av_com} | Extension : ${setup.susp_av_ext}`;
        
        htmlResultat += `<div class="section-title">Suspension Arrière (1 à 7)</div>`;
        htmlResultat += `Précharge : ${setup.susp_ar_pre} | Ressort : ${setup.susp_ar_res} | Comp. Lente : ${setup.susp_ar_cl}<br>`;
        htmlResultat += `Comp. Rapide : ${setup.susp_ar_cr} | Extension : ${setup.susp_ar_ext}`;
        
        htmlResultat += `<div class="section-title">Boîte de Vitesse & Transmission (1 à 7)</div>`;
        htmlResultat += `1ère: ${setup.bv_1} | 2ème: ${setup.bv_2} | 3ème: ${setup.bv_3} | 4ème: ${setup.bv_4} | 5ème: ${setup.bv_5} | 6ème: ${setup.bv_6}<br>`;
        htmlResultat += `Rapport Final : ${setup.bv_final} | Anti-dribble : <strong>${setup.anti_dribble}</strong>`;
        
        htmlResultat += `<div class="section-title">Freins & Électronique</div>`;
        htmlResultat += `Frein Av : ${setup.frein_avant} | Frein Ar : ${setup.frein_arriere}<br>`;
        htmlResultat += `TCS : ${setup.ecu_tcs} | Anti-Wheelie : ${setup.ecu_aw} | Frein Moteur (EBS) : ${setup.ecu_ebs}`;
        
        htmlResultat += `<div class="section-title">Géométrie (1 à 7)</div>`;
        htmlResultat += `Chasse : ${setup.geo_cha} | Déport : ${setup.geo_dep} | Plaque : ${setup.geo_pla} | Bras : ${setup.geo_bra}`;

        const box = document.getElementById('setupCompletBox');
        if(box) {
            box.innerHTML = htmlResultat;
            box.style.display = 'block';
        }
    });
}
