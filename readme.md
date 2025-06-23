# Biblioteca de Grafos

Implementação das duas primeiras partes do trabalho prático de Algoritmos em Grafos (CEFET/RJ).

## Funcionalidades

- Leitura de grafos a partir de arquivos texto
- Suporte a grafos com e sem pesos
- Representação em matriz e lista de adjacência
- Geração de estatísticas:
  - Número de vértices
  - Número de arestas
  - Grau médio
  - Distribuição empírica dos graus
- Busca em largura (BFS)
- Busca em profundidade (DFS)
- Geração de árvore de busca com pai e nível de cada vértice
- Descoberta de componentes conexos do grafo
- Listagem dos componentes por tamanho e vértices que pertencem a cada um
- Cálculo de caminhos mínimos:
  - Para grafos sem pesos: utiliza BFS
  - Para grafos com pesos: utiliza Dijkstra
- Geração de arquivo de saída com:
  - As estatísticas do grafo
  - Os resultados das buscas (BFS e DFS)
  - Os componentes conexos
  - Os caminhos mínimos e distâncias

## Como usar

```bash
python exemplos/teste.py


O arquivo `exemplo.txt` será carregado e `saida.txt` será gerado com as estatísticas.

## 🙏 Agradecimentos aos Contribuidores ❤

<a href="https://github.com/paulemacedo/biblioteca-grafos/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=paulemacedo/biblioteca-grafos" alt="Colaboradores do projeto"/>
</a>
