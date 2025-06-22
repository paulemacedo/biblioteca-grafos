import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from grafolib.grafo import Grafo

grafo = Grafo()
grafo.carregar_arquivo(r"biblioteca-grafos\exemplos\exemplo_com_pesos.txt")
grafo.salvar_resumo(r"saida.txt", vertice_inicial=4)
