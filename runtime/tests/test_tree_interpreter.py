import json
from pathlib import Path
import unittest

from atende_runtime.tree.interpreter import TreeSession
from atende_runtime.tree.types import validate_tree


DATA = Path(__file__).parents[1] / "atende_runtime" / "data" / "tree.dev.json"


def load_tree():
    return json.loads(DATA.read_text(encoding="utf-8"))


class TreeInterpreterTests(unittest.TestCase):
    def test_validates_and_renders_template(self):
        session = TreeSession.start(validate_tree(load_tree()))
        self.assertIn("Clínica Teste", session.render_speech({"clinica": "Clínica Teste"}))

    def test_closed_slot_and_edge_transition(self):
        session = TreeSession.start(load_tree())
        self.assertTrue(session.record_slot("motivo", "urgente"))
        self.assertEqual(session.transition(), "triagem_urgente")
        self.assertEqual(session.continue_after_action(), "transferir_humano")

    def test_closed_slot_rejects_value_and_free_text_accepts_whole_value(self):
        session = TreeSession.start(load_tree())
        self.assertFalse(session.record_slot("motivo", "algo fora da lista"))
        self.assertEqual(session.transition({"motivo": "agendar"}), "agendamento")
        self.assertTrue(session.record_slot("especialidade", "  limpeza e avaliação  "))
        self.assertEqual(session.slots["especialidade"], "limpeza e avaliação")

    def test_two_unmatched_retries_transfer_to_human(self):
        session = TreeSession.start(load_tree())
        self.assertEqual(session.transition(), "retry")
        self.assertEqual(session.transition(), "transferir_humano")

    def test_invalid_reference_is_rejected(self):
        tree = load_tree()
        tree["nodes"]["boas_vindas"]["edges"][0]["goto"] = "missing"
        with self.assertRaisesRegex(ValueError, "destino inexistente"):
            validate_tree(tree)
