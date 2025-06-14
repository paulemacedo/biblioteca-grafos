import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from grafolib.grafo import Grafo

grafo = Grafo()
grafo.carregar_arquivo("exemplos/exemplo.txt")
grafo.salvar_resumo("exemplos/saida.txt")
