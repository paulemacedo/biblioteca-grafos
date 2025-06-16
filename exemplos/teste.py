import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from grafolib.grafo import Grafo

grafo = Grafo()
grafo.carregar_arquivo(r"exemplos\\exemplo.txt")
grafo.salvar_resumo(r"saida.txt", vertice_inicial=4)
