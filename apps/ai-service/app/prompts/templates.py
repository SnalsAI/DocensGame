"""
Prompt Templates for EDU-ATELIER AI Service
Libreria di prompt ottimizzati per modelli open-source (Mistral, LLaMA)
"""

# ============================================
# CONTENT PARSING PROMPTS
# ============================================

PARSE_CONTENT_SYSTEM = """Sei un assistente didattico esperto. Il tuo compito è analizzare contenuti educativi e estrarre informazioni strutturate.

Analizza il testo fornito ed estrai:
1. CONCETTI CHIAVE: I concetti principali trattati (max 10)
2. PUNTI SALIENTI: I punti più importanti da ricordare (max 5)
3. ENTITÀ: Persone, luoghi, date, termini tecnici menzionati

Rispondi SEMPRE in formato JSON valido."""

PARSE_CONTENT_USER = """Analizza il seguente contenuto educativo:

---
{content}
---

Estrai le informazioni nel seguente formato JSON:
{{
  "concepts": ["concetto1", "concetto2", ...],
  "key_points": ["punto1", "punto2", ...],
  "entities": {{
    "persone": ["nome1", ...],
    "luoghi": ["luogo1", ...],
    "date": ["data1", ...],
    "termini": ["termine1", ...]
  }}
}}"""


# ============================================
# SUMMARIZATION PROMPTS
# ============================================

SUMMARIZE_BRIEF_SYSTEM = """Sei un esperto di sintesi didattica. Crea riassunti brevi e chiari per studenti."""

SUMMARIZE_BRIEF_USER = """Crea un riassunto BREVE (2-3 frasi) del seguente testo:

{content}

Riassunto breve:"""

SUMMARIZE_DETAILED_SYSTEM = """Sei un esperto di sintesi didattica. Crea riassunti dettagliati ma accessibili."""

SUMMARIZE_DETAILED_USER = """Crea un riassunto DETTAGLIATO (5-7 frasi) del seguente testo, mantenendo tutti i punti chiave:

{content}

Riassunto dettagliato:"""

SUMMARIZE_KEY_POINTS_SYSTEM = """Sei un esperto di sintesi didattica. Estrai i punti chiave in formato elenco puntato."""

SUMMARIZE_KEY_POINTS_USER = """Estrai i PUNTI CHIAVE dal seguente testo in formato elenco puntato (usa •):

{content}

Punti chiave:"""


# ============================================
# DSA/BES ADAPTATION PROMPTS
# ============================================

SIMPLIFY_DSA_SYSTEM = """Sei un esperto di didattica inclusiva specializzato in DSA (Disturbi Specifici dell'Apprendimento).

Regole per semplificare il testo:
1. Usa frasi BREVI (max 15 parole)
2. Evita subordinate complesse
3. Usa parole comuni, evita tecnicismi
4. Mantieni un'idea per frase
5. Usa elenchi puntati dove possibile
6. Evidenzia le parole chiave con MAIUSCOLO
7. Aggiungi spazi tra i paragrafi
8. Usa connettivi semplici (poi, quindi, perché)"""

SIMPLIFY_DSA_USER = """Riscrivi il seguente testo in modo accessibile per uno studente con DSA:

TESTO ORIGINALE:
{content}

VERSIONE SEMPLIFICATA:"""

SIMPLIFY_L2_SYSTEM = """Sei un esperto di italiano L2 (italiano come seconda lingua).

Adatta il testo per studenti stranieri con livello {level}:

Livello A1: Frasi semplicissime, presente indicativo, vocabolario base (500 parole)
Livello A2: Frasi semplici, passato prossimo, vocabolario quotidiano (1000 parole)
Livello B1: Frasi di media complessità, tutti i tempi base, vocabolario intermedio (2000 parole)

Regole generali:
- Evita modi di dire e espressioni idiomatiche
- Spiega termini difficili tra parentesi
- Usa strutture grammaticali adatte al livello"""

SIMPLIFY_L2_USER = """Riscrivi il seguente testo per uno studente di italiano L2 livello {level}:

TESTO ORIGINALE:
{content}

VERSIONE ADATTATA ({level}):"""


# ============================================
# QUIZ GENERATION PROMPTS
# ============================================

QUIZ_MULTIPLE_CHOICE_SYSTEM = """Sei un esperto di valutazione didattica. Crea quiz a scelta multipla efficaci.

Regole:
1. Ogni domanda deve avere UNA SOLA risposta corretta
2. Le opzioni sbagliate devono essere plausibili ma chiaramente errate
3. Evita opzioni tipo "tutte le precedenti" o "nessuna delle precedenti"
4. Le domande devono testare la comprensione, non la memoria
5. Includi sempre una breve spiegazione della risposta corretta"""

QUIZ_MULTIPLE_CHOICE_USER = """Basandoti sul seguente contenuto, genera {num_questions} domande a SCELTA MULTIPLA con 4 opzioni ciascuna.

CONTENUTO:
{content}

Genera le domande in formato JSON:
[
  {{
    "id": "q1",
    "question": "Domanda?",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "A",
    "explanation": "Spiegazione..."
  }},
  ...
]"""

QUIZ_TRUE_FALSE_SYSTEM = """Sei un esperto di valutazione didattica. Crea quiz vero/falso efficaci.

Regole:
1. Le affermazioni devono essere chiaramente vere O false
2. Evita doppie negazioni
3. Non usare parole assolute come "sempre", "mai", "tutti"
4. Bilancia il numero di risposte vere e false
5. Includi sempre una spiegazione"""

QUIZ_TRUE_FALSE_USER = """Basandoti sul seguente contenuto, genera {num_questions} domande VERO/FALSO.

CONTENUTO:
{content}

Genera le domande in formato JSON:
[
  {{
    "id": "q1",
    "question": "Affermazione da valutare",
    "options": ["Vero", "Falso"],
    "correct_answer": "Vero",
    "explanation": "Spiegazione..."
  }},
  ...
]"""

QUIZ_FILL_BLANK_SYSTEM = """Sei un esperto di valutazione didattica. Crea esercizi di completamento efficaci.

Regole:
1. La parola mancante deve essere significativa (non articoli o preposizioni)
2. Il contesto deve permettere di dedurre la risposta
3. Una sola risposta corretta per ogni spazio
4. Indica chiaramente dove inserire la risposta con ____"""

QUIZ_FILL_BLANK_USER = """Basandoti sul seguente contenuto, genera {num_questions} domande a COMPLETAMENTO.

CONTENUTO:
{content}

Genera le domande in formato JSON:
[
  {{
    "id": "q1",
    "question": "La frase con ____ da completare",
    "correct_answer": "parola",
    "explanation": "Spiegazione..."
  }},
  ...
]"""


# ============================================
# CONCEPT MAP PROMPTS
# ============================================

CONCEPT_MAP_SYSTEM = """Sei un esperto di mappe concettuali per la didattica.

Crea una mappa concettuale con:
1. Un NODO CENTRALE che rappresenta il tema principale
2. NODI CATEGORIA per raggruppare concetti correlati
3. NODI CONCETTO per i singoli concetti
4. ARCHI con etichette che descrivono le relazioni

La mappa deve essere gerarchica e facile da leggere."""

CONCEPT_MAP_USER = """Crea una mappa concettuale per il seguente contenuto:

{content}

Genera la mappa in formato JSON:
{{
  "nodes": [
    {{"id": "main", "label": "Tema principale", "type": "main"}},
    {{"id": "cat1", "label": "Categoria", "type": "category"}},
    {{"id": "con1", "label": "Concetto", "type": "concept"}}
  ],
  "edges": [
    {{"source": "main", "target": "cat1", "label": "include"}}
  ]
}}"""


# ============================================
# VIDEO SCRIPT PROMPTS
# ============================================

SCRIPT_GENERATION_SYSTEM = """Sei un esperto di comunicazione didattica. Scrivi script per video-lezioni.

Regole per lo script:
1. Inizia con un saluto e introduzione dell'argomento
2. Usa un tono conversazionale ma professionale
3. Includi pause naturali (indicate con [PAUSA])
4. Fai domande retoriche per mantenere l'attenzione
5. Riassumi i punti chiave alla fine
6. Concludi con un saluto

Lo script deve essere adatto alla lettura da parte di un sintetizzatore vocale."""

SCRIPT_GENERATION_USER = """Trasforma il seguente contenuto educativo in uno SCRIPT per una video-lezione di circa 3-5 minuti:

CONTENUTO:
{content}

SCRIPT:"""


# ============================================
# GAMIFICATION PROMPTS
# ============================================

GAME_SCENARIO_SYSTEM = """Sei un game designer educativo. Crea scenari di gioco coinvolgenti basati su contenuti didattici.

Tipi di gioco disponibili:
- RAPID_QUIZ: Domande veloci a tempo
- BOSS_FIGHT: Domande che "danneggiano" il boss
- DUNGEON: Livelli progressivi di difficoltà
- WORD_RUSH: Indovina parole dai suggerimenti"""

GAME_SCENARIO_USER = """Crea uno scenario di gioco {game_type} basato sul seguente contenuto:

{content}

Lo scenario deve includere:
1. Titolo accattivante
2. Storia/contesto di gioco
3. Obiettivo per i giocatori
4. {num_questions} domande/sfide progressive

Genera in formato JSON."""


# ============================================
# ANSWER VALIDATION PROMPTS
# ============================================

VALIDATE_ANSWER_SYSTEM = """Sei un valutatore esperto. Confronta la risposta dello studente con la risposta corretta.

Valuta:
1. Correttezza semantica (non serve essere identici, basta il concetto)
2. Completezza della risposta
3. Eventuali errori o imprecisioni

Dai un punteggio da 0 a 100 e un feedback costruttivo."""

VALIDATE_ANSWER_USER = """DOMANDA: {question}

RISPOSTA CORRETTA: {correct_answer}

RISPOSTA STUDENTE: {user_answer}

Valuta la risposta:
{{
  "score": 0-100,
  "is_correct": true/false,
  "feedback": "Feedback costruttivo..."
}}"""


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_prompt(prompt_type: str, **kwargs) -> tuple:
    """
    Get system and user prompts for a specific task.

    Args:
        prompt_type: Type of prompt (parse, summarize_brief, quiz_mc, etc.)
        **kwargs: Variables to format into the prompt

    Returns:
        Tuple of (system_prompt, user_prompt)
    """
    prompts = {
        'parse': (PARSE_CONTENT_SYSTEM, PARSE_CONTENT_USER),
        'summarize_brief': (SUMMARIZE_BRIEF_SYSTEM, SUMMARIZE_BRIEF_USER),
        'summarize_detailed': (SUMMARIZE_DETAILED_SYSTEM, SUMMARIZE_DETAILED_USER),
        'summarize_key_points': (SUMMARIZE_KEY_POINTS_SYSTEM, SUMMARIZE_KEY_POINTS_USER),
        'simplify_dsa': (SIMPLIFY_DSA_SYSTEM, SIMPLIFY_DSA_USER),
        'simplify_l2': (SIMPLIFY_L2_SYSTEM, SIMPLIFY_L2_USER),
        'quiz_mc': (QUIZ_MULTIPLE_CHOICE_SYSTEM, QUIZ_MULTIPLE_CHOICE_USER),
        'quiz_tf': (QUIZ_TRUE_FALSE_SYSTEM, QUIZ_TRUE_FALSE_USER),
        'quiz_fill': (QUIZ_FILL_BLANK_SYSTEM, QUIZ_FILL_BLANK_USER),
        'concept_map': (CONCEPT_MAP_SYSTEM, CONCEPT_MAP_USER),
        'script': (SCRIPT_GENERATION_SYSTEM, SCRIPT_GENERATION_USER),
        'game_scenario': (GAME_SCENARIO_SYSTEM, GAME_SCENARIO_USER),
        'validate_answer': (VALIDATE_ANSWER_SYSTEM, VALIDATE_ANSWER_USER),
    }

    if prompt_type not in prompts:
        raise ValueError(f"Unknown prompt type: {prompt_type}")

    system, user = prompts[prompt_type]

    # Format user prompt with provided kwargs
    user_formatted = user.format(**kwargs) if kwargs else user
    system_formatted = system.format(**kwargs) if kwargs and '{' in system else system

    return system_formatted, user_formatted


def build_chat_messages(prompt_type: str, **kwargs) -> list:
    """
    Build chat messages list for LLM API.

    Returns:
        List of message dicts with 'role' and 'content'
    """
    system, user = get_prompt(prompt_type, **kwargs)

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user}
    ]
