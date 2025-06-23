import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from grafolib.grafo import Grafo

grafo = Grafo()
caminho = os.path.join(os.path.dirname(__file__), "exemplo_com_pesos.txt")
grafo.carregar_arquivo(caminho)
grafo.salvar_resumo(r"saida.txt", vertice_inicial=4)
