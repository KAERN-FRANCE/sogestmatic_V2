"""
Test d'intégration de l'Article 13 - Dérogations UE 561/2006
"""

import asyncio
from legifrance_enhanced import recherche_exhaustive_legifrance
from article_13_derogations import get_article_13_derogations

async def test_integration_article_13():
    """Test complet de l'intégration Article 13"""
    
    print("🧪 Test d'intégration Article 13 - Dérogations UE 561/2006")
    print("=" * 60)
    
    # Test 1 : Génération standalone des dérogations
    print("\n📋 Test 1 : Génération des dérogations Article 13")
    derogations = get_article_13_derogations()
    print(f"✅ {len(derogations)} dérogations générées")
    
    # Analyse des dérogations
    derogations_avec_rayon = [d for d in derogations if d.get('rayon_km')]
    derogations_ptac = [d for d in derogations if d.get('ptac_max_tonnes')]
    derogations_secteurs = [d for d in derogations if d.get('secteurs') or d.get('secteur')]
    
    print(f"   • Dérogations avec rayon: {len(derogations_avec_rayon)}")
    print(f"   • Dérogations avec limite PTAC: {len(derogations_ptac)}")
    print(f"   • Dérogations sectorielles: {len(derogations_secteurs)}")
    
    # Test 2 : Intégration dans le système complet
    print("\n🔄 Test 2 : Intégration dans le système complet")
    try:
        toutes_infractions = await recherche_exhaustive_legifrance()
        
        # Vérifier la présence des dérogations Article 13
        article13_integres = [
            infr for infr in toutes_infractions 
            if infr.get('id', '').startswith('ART13_')
        ]
        
        print(f"✅ Système complet : {len(toutes_infractions)} infractions totales")
        print(f"✅ Article 13 intégré : {len(article13_integres)} dérogations trouvées")
        
        if len(article13_integres) == len(derogations):
            print("✅ SUCCÈS : Toutes les dérogations Article 13 sont intégrées")
        else:
            print("⚠️  ATTENTION : Intégration partielle des dérogations")
            
    except Exception as e:
        print(f"❌ Erreur lors de l'intégration : {e}")
        return False
    
    # Test 3 : Analyse des dérogations par catégorie
    print("\n📊 Test 3 : Analyse des dérogations par secteur")
    
    secteurs_analyse = {}
    for derog in derogations:
        if derog.get('secteurs'):
            for secteur in derog['secteurs']:
                secteurs_analyse[secteur] = secteurs_analyse.get(secteur, 0) + 1
        elif derog.get('secteur'):
            secteur = derog['secteur']
            secteurs_analyse[secteur] = secteurs_analyse.get(secteur, 0) + 1
    
    print("Répartition par secteur :")
    for secteur, count in sorted(secteurs_analyse.items()):
        print(f"   • {secteur}: {count} dérogation(s)")
    
    # Test 4 : Dérogations les plus importantes
    print("\n🎯 Test 4 : Dérogations les plus importantes")
    
    importantes = [
        ('ART13_b_vehicules_agricoles', 'Secteur agricole - 100km'),
        ('ART13_d_service_postal', 'Service postal ≤7,5T'),
        ('ART13_f_vehicules_ecologiques', 'Véhicules écologiques ≤7,5T'),
        ('ART13_i_minibus_non_commercial', 'Minibus 10-17 places non commercial'),
        ('ART13_q_engins_construction', 'Transport engins construction')
    ]
    
    for derog_id, description in importantes:
        derog_trouvee = next((d for d in derogations if d['id'] == derog_id), None)
        if derog_trouvee:
            print(f"✅ {description}")
            if derog_trouvee.get('rayon_km'):
                print(f"    Rayon: {derog_trouvee['rayon_km']} km")
            if derog_trouvee.get('ptac_max_tonnes'):
                print(f"    PTAC max: {derog_trouvee['ptac_max_tonnes']} tonnes")
        else:
            print(f"❌ {description} - NON TROUVÉE")
    
    # Test 5 : Validation des métadonnées
    print("\n🔍 Test 5 : Validation des métadonnées")
    
    erreurs = []
    for i, derog in enumerate(derogations):
        # Vérifier les champs obligatoires
        champs_requis = ['id', 'titre', 'description', 'conditions', 'article', 'code_source']
        for champ in champs_requis:
            if not derog.get(champ):
                erreurs.append(f"Dérogation {i+1}: champ '{champ}' manquant")
        
        # Vérifier que les conditions ne sont pas vides
        if not derog.get('conditions') or len(derog['conditions']) == 0:
            erreurs.append(f"Dérogation {i+1} ({derog.get('id', 'inconnue')}): conditions vides")
    
    if erreurs:
        print(f"❌ {len(erreurs)} erreur(s) détectée(s):")
        for erreur in erreurs[:5]:  # Limiter l'affichage
            print(f"   • {erreur}")
        if len(erreurs) > 5:
            print(f"   ... et {len(erreurs) - 5} autres erreurs")
    else:
        print("✅ Toutes les métadonnées sont valides")
    
    # Résumé final
    print("\n" + "=" * 60)
    print("📈 RÉSUMÉ DU TEST ARTICLE 13")
    print(f"• {len(derogations)} dérogations générées")
    print(f"• {len(article13_integres)} dérogations intégrées au système")
    print(f"• {len(secteurs_analyse)} secteurs d'activité couverts")
    print(f"• {len(erreurs)} erreur(s) de validation")
    
    if len(erreurs) == 0 and len(article13_integres) == len(derogations):
        print("\n🎉 SUCCÈS COMPLET : Article 13 parfaitement intégré !")
        return True
    else:
        print("\n⚠️  INTÉGRATION PARTIELLE : Vérifier les erreurs ci-dessus")
        return False

if __name__ == "__main__":
    asyncio.run(test_integration_article_13()) 