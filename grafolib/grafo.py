from collections import deque, defaultdict
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
                u = int(partes[0]) - 1
                v = int(partes[1]) - 1

                self.matriz_adj[u][v] = 1
                self.matriz_adj[v][u] = 1

                self.lista_adj[u].append(v)
                self.lista_adj[v].append(u)

                self.num_arestas += 1



    def bfs(self, inicio):
        #define o grupo de visitados como falso (no começo ninguem foi visitado) e inicia sem pai e sem nivel (por isso o [-1]) 
        visitado = [False] * self.num_vertices
        pai = [-1] * self.num_vertices
        nivel = [-1] * self.num_vertices
        #inicia a fila com o vertice inicial e o nivel 0 e já marca o inicial como visitado
        fila = deque([inicio])
        visitado[inicio] = True
        nivel[inicio] = 0
        #enquanto tiver fila, ele retira o próximo da fila porque ele será o proximo a ser verificado se tem vizinhos
        while fila:
            u = fila.popleft()
            #se o v é vizinho de u e e ainda não foi visitado, ele é marcado como visitado(true) e é colocado na fila pra olhar os vizinhos dele
            for v in self.lista_adj[u]:
                if not visitado[v]:
                    visitado[v] = True
                    pai[v] = u
                    nivel[v] = nivel[u] + 1
                    fila.append(v)
        return pai, nivel
    #inicializacao igual a do bfs marcando todo o grupo de visitados como falso, sem pai e sem nivel (pq ainda não começou), usamos recursividade mas poderia ser feito usando pilha
    def dfs(self, inicio):
        visitado = [False] * self.num_vertices
        pai = [-1] * self.num_vertices
        nivel = [-1] * self.num_vertices
        #essa parte pega o vertice, coloca ele como visitado e define o nivel dele
        def dfs_rec(u, d):
            visitado[u] = True
            nivel[u] = d
            #pra cada vizinho do vertice, se ele nao foi visitado, coloca o vertice analisado como pai e chama a função recursiva com o proximo vizinho para ir ate o final
            for v in self.lista_adj[u]:
                if not visitado[v]:
                    pai[v] = u
                    dfs_rec(v, d + 1)
        #comeco da funcao com o vertice inicial e nivel 0            
        dfs_rec(inicio, 0)
        return pai, nivel


    #inicia com a lista de visitado que mostra que nao foi explorado nenhum vertice em nenhum componente ainda
    def componentes_conexos(self):
            visitado = [False] * self.num_vertices
            componentes = []
            #percorre os vertices e se nao for visitado aplica o bfs pra pegar quem é e o nivel dele
            for v in range(self.num_vertices):
                if not visitado[v]:
                    _, nivel = self.bfs(v)
                    #se tiver alguem com o nivel [-1] é pq ele não foi alcançado, todo mundo que foi alcançado tem nivel >=0
                    componente = [u for u in range(self.num_vertices) if nivel[u] != -1]
                    #pra cada u que esta na lista componente é marcado como visitado e e essa lista componente vai pra lista componentes
                    for u in componente:
                        visitado[u] = True
                    componentes.append(componente)

            return componentes
        
    def salvar_resumo(self, caminho_saida, vertice_inicial=0):
            graus = [len(adj) for adj in self.lista_adj]
            grau_medio = sum(graus) / self.num_vertices if self.num_vertices > 0 else 0
            distribuicao = {}
            for grau in graus:
                distribuicao[grau] = distribuicao.get(grau, 0) + 1

            with open(caminho_saida, 'w') as f:
                f.write(f"# n = {self.num_vertices}\n")
                f.write(f"# m = {self.num_arestas}\n")
                f.write(f"# d_medio = {grau_medio:.1f}\n")
                for grau, qtd in sorted(distribuicao.items()):
                    freq = qtd / self.num_vertices
                    f.write(f"{grau} {freq:.2f}\n")

                f.write(f"\nBusca em Largura (BFS) a partir do vertice {vertice_inicial}:\n")
                pai_bfs, nivel_bfs = self.bfs(vertice_inicial)
                for v in range(self.num_vertices):
                    f.write(f"  Vertice {v + 1}: pai = {pai_bfs[v] + 1 if pai_bfs[v] != -1 else -1}, nivel = {nivel_bfs[v]}\n")

                f.write(f"\nBusca em Profundidade (DFS) a partir do vertice {vertice_inicial}:\n")
                pai_dfs, nivel_dfs = self.dfs(vertice_inicial)
                for v in range(self.num_vertices):
                    f.write(f"  Vertice {v + 1}: pai = {pai_dfs[v] + 1 if pai_dfs[v] != -1 else -1}, nivel = {nivel_dfs[v]}\n")

                componentes = self.componentes_conexos()
                f.write(f"\nNumero de componentes conexos: {len(componentes)}\n")
                f.write("Componentes:\n")
                componentes.sort(key=lambda x: -len(x))
                for i, comp in enumerate(componentes):
                    f.write(f"  Componente {i+1} (tamanho {len(comp)}): {[v + 1 for v in sorted(comp)]}\n")