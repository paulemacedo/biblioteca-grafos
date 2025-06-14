class Grafo:
    def __init__(self, usar_matriz=True):
        self.usar_matriz = usar_matriz
        self.num_vertices = 0
        self.num_arestas = 0
        self.matriz_adj = []
        self.lista_adj = []

    def carregar_arquivo(self, caminho):
        with open(caminho, 'r') as f:
            linhas = f.readlines()

        self.num_vertices = int(linhas[0].strip())
        self.matriz_adj = [[0] * self.num_vertices for _ in range(self.num_vertices)]
        self.lista_adj = [[] for _ in range(self.num_vertices)]

        for linha in linhas[1:]:
            partes = linha.strip().split()
            if len(partes) >= 2:
                u = int(partes[0])
                v = int(partes[1])

                self.matriz_adj[u][v] = 1
                self.matriz_adj[v][u] = 1

                self.lista_adj[u].append(v)
                self.lista_adj[v].append(u)

                self.num_arestas += 1

    def salvar_resumo(self, caminho_saida):
        graus = [len(adj) for adj in self.lista_adj]
        grau_medio = sum(graus) / self.num_vertices if self.num_vertices > 0 else 0

        distribuicao = {}
        for grau in graus:
            distribuicao[grau] = distribuicao.get(grau, 0) + 1

        with open(caminho_saida, 'w') as f:
            f.write(f"Número de vértices: {self.num_vertices}\n")
            f.write(f"Número de arestas: {self.num_arestas}\n")
            f.write(f"Grau médio: {grau_medio:.2f}\n")
            f.write("Distribuição empírica dos graus:\n")
            for grau, qtd in sorted(distribuicao.items()):
                f.write(f"  Grau {grau}: {qtd} vértice(s)\n")
