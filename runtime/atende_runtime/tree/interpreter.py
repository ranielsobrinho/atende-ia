"""Operações determinísticas de execução da DSL, sem dependências de I/O/IA."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

from .types import CallTree, validate_tree

_CONDITION = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*)\s*==\s*(['\"])(.*?)\2$")


@dataclass
class TreeSession:
    tree: CallTree
    current_node: str | None = None
    slots: dict[str, str] = field(default_factory=dict)
    retry_count: int = 0

    @classmethod
    def start(cls, tree: dict[str, Any]) -> "TreeSession":
        valid_tree = validate_tree(tree)
        return cls(tree=valid_tree, current_node=valid_tree["entry"])

    @property
    def node(self) -> dict[str, Any] | None:
        return self.tree["nodes"].get(self.current_node) if self.current_node else None

    def render_speech(self, variables: dict[str, str] | None = None) -> str:
        if self.node is None:
            return ""
        values = {**(variables or {}), **self.slots}
        return re.sub(r"\{([A-Za-z_][A-Za-z0-9_]*)\}", lambda m: values.get(m.group(1), m.group(0)), self.node.get("speech", ""))

    def record_slot(self, slot: str, value: str) -> bool:
        """Aceita apenas valores declarados; FREE_TEXT preserva a fala integral."""
        if self.node is None or not isinstance(value, str) or not value.strip():
            return False
        declaration = self.node.get("extract", {}).get(slot)
        if declaration is None:
            return False
        candidate = value.strip()
        if declaration != "FREE_TEXT":
            matches = [choice for choice in declaration if choice.casefold() == candidate.casefold()]
            if not matches:
                return False
            candidate = matches[0]
        self.slots[slot] = candidate
        return True

    def transition(self, extracted: dict[str, str] | None = None) -> str:
        """Resolve arestas por ordem; duas falhas sem match transferem para humano."""
        if self.node is None:
            return "encerrar"
        for key, value in (extracted or {}).items():
            self.record_slot(key, value)
        for edge in self.node.get("edges", []):
            condition = edge["when"]
            if condition == "fallback":
                continue
            match = _CONDITION.match(condition)
            if match and self.slots.get(match.group(1)) == match.group(3):
                self.current_node = edge["goto"] if edge["goto"] in self.tree["nodes"] else None
                self.retry_count = 0
                return edge["goto"]
        self.retry_count += 1
        if self.retry_count >= 2:
            self.current_node = None
            return "transferir_humano"
        fallback = next((e["goto"] for e in self.node.get("edges", []) if e["when"] == "fallback"), None)
        if fallback:
            if fallback == "transferir_humano":
                return "retry"
            self.current_node = fallback if fallback in self.tree["nodes"] else None
            return fallback
        return "retry"

    def continue_after_action(self) -> str:
        if self.node is None:
            return "encerrar"
        target = self.node.get("then", "encerrar")
        self.current_node = target if target in self.tree["nodes"] else None
        return target
