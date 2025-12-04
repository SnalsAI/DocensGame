"""
Model Manager - Handles AI model loading and inference
"""

import asyncio
import uuid
from typing import List, Dict, Any, Optional
import re

from app.core.config import settings


class ModelManager:
    """
    Manages AI models for content processing
    In development mode, uses mock responses
    In production, loads actual models (Mistral, LLaMA, etc.)
    """

    def __init__(self):
        self.llm = None
        self.embeddings = None
        self.is_initialized = False

    async def initialize(self):
        """Initialize models"""
        print(f"🔧 Initializing ModelManager (GPU: {settings.USE_GPU})")

        # In development, we use mock responses
        # In production, this would load actual models:
        # - Mistral 7B or LLaMA for text generation
        # - Sentence transformers for embeddings

        if settings.DEBUG:
            print("📌 Running in DEBUG mode - using mock responses")
        else:
            await self._load_models()

        self.is_initialized = True

    async def _load_models(self):
        """Load actual ML models (production only)"""
        try:
            # This would load actual models in production
            # from transformers import AutoModelForCausalLM, AutoTokenizer
            # self.tokenizer = AutoTokenizer.from_pretrained(settings.LLM_MODEL)
            # self.llm = AutoModelForCausalLM.from_pretrained(settings.LLM_MODEL)
            pass
        except Exception as e:
            print(f"⚠️ Failed to load models: {e}")

    async def cleanup(self):
        """Cleanup resources"""
        self.llm = None
        self.embeddings = None

    async def parse_content(self, text: str, file_url: Optional[str] = None) -> Dict[str, Any]:
        """Parse content and extract structured information"""
        await asyncio.sleep(0.5)  # Simulate processing

        # Extract concepts (simplified NLP)
        words = text.lower().split()
        unique_words = list(set([w for w in words if len(w) > 5]))[:10]

        # Mock entity extraction
        entities = {
            "persone": self._extract_names(text),
            "luoghi": self._extract_places(text),
            "date": self._extract_dates(text),
            "concetti": unique_words[:5],
        }

        # Extract key points (mock)
        sentences = text.split('.')[:5]
        key_points = [s.strip() for s in sentences if len(s.strip()) > 20]

        return {
            "concepts": unique_words[:8],
            "key_points": key_points[:5],
            "entities": entities,
        }

    async def summarize(self, text: str, summary_type: str) -> str:
        """Generate summary of text"""
        await asyncio.sleep(0.3)

        sentences = text.split('.')

        if summary_type == "brief":
            return '. '.join(sentences[:2]).strip() + '.'
        elif summary_type == "detailed":
            return '. '.join(sentences[:5]).strip() + '.'
        elif summary_type == "key_points":
            points = [f"• {s.strip()}" for s in sentences[:5] if s.strip()]
            return '\n'.join(points)
        elif summary_type == "dsa_adapted":
            # Simplified language
            simplified = await self.simplify_text(text, "dsa")
            return simplified["simplified"]
        elif summary_type == "l2_adapted":
            simplified = await self.simplify_text(text, "l2_a2")
            return simplified["simplified"]

        return sentences[0] if sentences else text[:200]

    async def generate_concept_map(self, text: str) -> Dict[str, Any]:
        """Generate concept map nodes and edges"""
        await asyncio.sleep(0.5)

        # Extract key terms
        words = text.lower().split()
        key_terms = list(set([w for w in words if len(w) > 6]))[:6]

        # Create nodes
        nodes = [{"id": "main", "label": "Argomento Principale", "type": "main"}]
        for i, term in enumerate(key_terms):
            nodes.append({
                "id": f"concept_{i}",
                "label": term.capitalize(),
                "type": "concept"
            })

        # Create edges
        edges = []
        for i in range(len(key_terms)):
            edges.append({
                "source": "main",
                "target": f"concept_{i}",
                "label": "include"
            })

        # Add some concept-to-concept connections
        if len(key_terms) >= 2:
            edges.append({
                "source": "concept_0",
                "target": "concept_1",
                "label": "correlato"
            })

        return {"nodes": nodes, "edges": edges}

    async def generate_script(self, text: str, style: str = "educational") -> str:
        """Generate narration script for video"""
        await asyncio.sleep(0.5)

        # Add intro
        intro = "Benvenuti a questa lezione. Oggi parleremo di un argomento importante.\n\n"

        # Process text into spoken format
        sentences = text.split('.')
        processed = []

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            # Add pauses and transitions
            if len(processed) > 0 and len(processed) % 3 == 0:
                processed.append("\n[PAUSA]\n")

            processed.append(sentence + '.')

        # Add outro
        outro = "\n\nQuesto conclude la nostra lezione di oggi. Grazie per l'attenzione!"

        return intro + ' '.join(processed) + outro

    async def generate_quiz(
        self,
        text: str,
        quiz_type: str,
        num_questions: int,
        difficulty: str,
    ) -> List[Dict[str, Any]]:
        """Generate quiz questions"""
        await asyncio.sleep(0.5)

        questions = []
        sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 20]

        for i in range(min(num_questions, len(sentences))):
            q_id = str(uuid.uuid4())[:8]
            sentence = sentences[i] if i < len(sentences) else f"Domanda {i+1}"

            if quiz_type == "true_false":
                questions.append({
                    "id": q_id,
                    "question": f"Vero o Falso: {sentence}",
                    "type": "true_false",
                    "options": ["Vero", "Falso"],
                    "correct_answer": "Vero",
                    "explanation": "Questa affermazione è corretta basandosi sul testo.",
                })
            elif quiz_type == "fill_blank":
                words = sentence.split()
                if len(words) > 3:
                    blank_word = words[len(words)//2]
                    question = sentence.replace(blank_word, "____")
                    questions.append({
                        "id": q_id,
                        "question": f"Completa la frase: {question}",
                        "type": "fill_blank",
                        "options": None,
                        "correct_answer": blank_word,
                        "explanation": f"La parola corretta è '{blank_word}'.",
                    })
            else:  # multiple_choice
                questions.append({
                    "id": q_id,
                    "question": f"Quale delle seguenti affermazioni è corretta? {sentence}",
                    "type": "multiple_choice",
                    "options": [
                        sentence[:50] + "...",
                        "Opzione B alternativa",
                        "Opzione C alternativa",
                        "Opzione D alternativa",
                    ],
                    "correct_answer": sentence[:50] + "...",
                    "explanation": "Questa è la risposta corretta basata sul contenuto.",
                })

        return questions

    async def validate_answer(
        self,
        question_id: str,
        user_answer: str,
        correct_answer: str,
    ) -> Dict[str, Any]:
        """Validate open-ended answer using semantic similarity"""
        await asyncio.sleep(0.2)

        # Simple word overlap check (in production, use embeddings)
        user_words = set(user_answer.lower().split())
        correct_words = set(correct_answer.lower().split())

        overlap = len(user_words & correct_words)
        total = len(correct_words)

        similarity = overlap / total if total > 0 else 0

        return {
            "question_id": question_id,
            "is_correct": similarity > 0.5,
            "similarity_score": similarity,
            "feedback": "Buona risposta!" if similarity > 0.5 else "Prova a rileggere il materiale.",
        }

    async def simplify_text(
        self,
        text: str,
        level: str,
        preserve_key_terms: bool = True,
    ) -> Dict[str, Any]:
        """Simplify text for DSA/BES/L2 students"""
        await asyncio.sleep(0.3)

        original_word_count = len(text.split())

        # Simple simplification rules
        simplified = text

        # Replace complex words with simpler alternatives
        replacements = {
            "tuttavia": "però",
            "pertanto": "quindi",
            "nonostante": "anche se",
            "conseguentemente": "così",
            "precedentemente": "prima",
            "successivamente": "dopo",
            "mediante": "con",
            "attraverso": "con",
        }

        for complex_word, simple_word in replacements.items():
            simplified = re.sub(
                rf'\b{complex_word}\b',
                simple_word,
                simplified,
                flags=re.IGNORECASE
            )

        # Split long sentences
        sentences = simplified.split('.')
        short_sentences = []
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 100:
                # Try to split at conjunctions
                parts = re.split(r',\s*(?:e|ma|però|quindi)\s*', sentence)
                short_sentences.extend([p.strip() for p in parts if p.strip()])
            elif sentence:
                short_sentences.append(sentence)

        simplified = '. '.join(short_sentences) + '.'

        simplified_word_count = len(simplified.split())

        return {
            "simplified": simplified,
            "reading_level": self._estimate_reading_level(simplified),
            "word_count_original": original_word_count,
            "word_count_simplified": simplified_word_count,
        }

    async def analyze_readability(self, text: str) -> Dict[str, float]:
        """Calculate readability metrics"""
        words = text.split()
        sentences = text.split('.')

        word_count = len(words)
        sentence_count = len([s for s in sentences if s.strip()])

        avg_sentence_length = word_count / sentence_count if sentence_count > 0 else 0
        avg_word_length = sum(len(w) for w in words) / word_count if word_count > 0 else 0

        # Simplified Flesch metrics
        flesch_reading_ease = 206.835 - 1.015 * avg_sentence_length - 84.6 * (avg_word_length / 5)
        flesch_kincaid_grade = 0.39 * avg_sentence_length + 11.8 * (avg_word_length / 5) - 15.59

        complex_words = [w for w in words if len(w) > 8]
        complex_percentage = len(complex_words) / word_count * 100 if word_count > 0 else 0

        return {
            "flesch_reading_ease": max(0, min(100, flesch_reading_ease)),
            "flesch_kincaid_grade": max(0, flesch_kincaid_grade),
            "average_sentence_length": avg_sentence_length,
            "average_word_length": avg_word_length,
            "complex_word_percentage": complex_percentage,
        }

    async def extract_keywords(self, text: str) -> Dict[str, Any]:
        """Extract and rank keywords"""
        words = text.lower().split()

        # Filter stopwords (simplified)
        stopwords = {'il', 'la', 'lo', 'i', 'gli', 'le', 'un', 'una', 'e', 'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'che', 'è', 'sono', 'non', 'si', 'come', 'più', 'anche', 'questo', 'quello'}

        filtered = [w for w in words if w not in stopwords and len(w) > 3]

        # Count frequency
        freq = {}
        for word in filtered:
            freq[word] = freq.get(word, 0) + 1

        # Sort by frequency
        sorted_keywords = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:10]

        return {
            "keywords": [{"word": w, "count": c} for w, c in sorted_keywords],
            "total_unique_words": len(set(filtered)),
        }

    def _extract_names(self, text: str) -> List[str]:
        """Extract person names (simplified)"""
        # Look for capitalized words that might be names
        words = text.split()
        names = []
        for i, word in enumerate(words):
            if word[0].isupper() and len(word) > 2:
                if i > 0 and words[i-1].lower() in ['signor', 'signora', 'prof', 'professor', 'dott', 'dottor']:
                    names.append(word)
        return list(set(names))[:5]

    def _extract_places(self, text: str) -> List[str]:
        """Extract place names (simplified)"""
        common_places = ['italia', 'roma', 'milano', 'europa', 'america', 'francia', 'germania']
        found = []
        text_lower = text.lower()
        for place in common_places:
            if place in text_lower:
                found.append(place.capitalize())
        return found

    def _extract_dates(self, text: str) -> List[str]:
        """Extract dates from text"""
        # Simple date pattern matching
        date_patterns = [
            r'\d{1,2}/\d{1,2}/\d{2,4}',
            r'\d{1,2}-\d{1,2}-\d{2,4}',
            r'\d{4}',  # Years
        ]

        dates = []
        for pattern in date_patterns:
            matches = re.findall(pattern, text)
            dates.extend(matches)

        return list(set(dates))[:5]

    def _estimate_reading_level(self, text: str) -> str:
        """Estimate reading level"""
        words = text.split()
        avg_word_len = sum(len(w) for w in words) / len(words) if words else 0

        if avg_word_len < 4.5:
            return "elementare"
        elif avg_word_len < 5.5:
            return "media"
        elif avg_word_len < 6.5:
            return "superiore"
        else:
            return "universitario"
