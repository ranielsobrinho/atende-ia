"""Tipos e validação estrutural da DSL compartilhada com a API."""

from __future__ import annotations

from typing import Any, Literal, TypedDict


Terminal = Literal["transferir_humano", "encerrar"]


class Edge(TypedDict):
    when: str
    goto: str


class Node(TypedDict, total=False):
    speech: str
    instructions: str
    extract: dict[str, list[str] | Literal["FREE_TEXT"]]
    edges: list[Edge]
    action: str
    postCall: dict[str, str]
    then: str


class CallTree(TypedDict):
    version: str
    entry: str
    nodes: dict[str, Node]


def validate_tree(raw: Any) -> CallTree:
    """Valida estrutura, referências e uma rota de escape fallback → humano."""
    if not isinstance(raw, dict):
        raise ValueError("A árvore deve ser um objeto JSON")
    if not isinstance(raw.get("version"), str) or not raw["version"]:
        raise ValueError("version deve ser uma string não vazia")
    nodes = raw.get("nodes")
    entry = raw.get("entry")
    if not isinstance(nodes, dict) or not nodes:
        raise ValueError("nodes deve conter ao menos um nó")
    if not isinstance(entry, str) or entry not in nodes:
        raise ValueError("entry deve apontar para um nó existente")

    fallback_to_human = False
    for node_id, node in nodes.items():
        if not isinstance(node_id, str) or not node_id or not isinstance(node, dict):
            raise ValueError("Cada nó precisa de um identificador e objeto válidos")
        if "speech" in node and not isinstance(node["speech"], str):
            raise ValueError(f"{node_id}.speech deve ser string")
        extracts = node.get("extract", {})
        if not isinstance(extracts, dict):
            raise ValueError(f"{node_id}.extract deve ser objeto")
        for slot, choices in extracts.items():
            if not isinstance(slot, str) or not slot:
                raise ValueError(f"{node_id}.extract contém slot inválido")
            if choices != "FREE_TEXT" and (
                not isinstance(choices, list) or not all(isinstance(value, str) for value in choices)
            ):
                raise ValueError(f"{node_id}.extract.{slot} deve ser lista de strings ou FREE_TEXT")
        edges = node.get("edges", [])
        if not isinstance(edges, list):
            raise ValueError(f"{node_id}.edges deve ser lista")
        for edge in edges:
            if not isinstance(edge, dict) or not isinstance(edge.get("when"), str):
                raise ValueError(f"{node_id} tem uma aresta inválida")
            target = edge.get("goto")
            if not isinstance(target, str) or (target not in nodes and target not in ("encerrar", "transferir_humano")):
                raise ValueError(f"{node_id} aponta para destino inexistente: {target}")
            if edge["when"] == "fallback" and target == "transferir_humano":
                fallback_to_human = True
        then = node.get("then")
        if then is not None and then not in nodes and then not in ("encerrar", "transferir_humano"):
            raise ValueError(f"{node_id}.then aponta para destino inexistente: {then}")
    if not fallback_to_human:
        raise ValueError("A árvore precisa de ao menos uma aresta fallback para transferir_humano")
    return raw
