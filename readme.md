# Biblioteca de Grafos

Implementação da primeira parte do trabalho prático de Algoritmos em Grafos (CEFET/RJ).

## Funcionalidades

- Leitura de grafos a partir de arquivos texto
- Representação em matriz e lista de adjacência
- Geração de estatísticas:
  - Número de vértices
  - Número de arestas
  - Grau médio
  - Distribuição empírica dos graus
- Implementar busca em largura (BFS)
- Implementar busca em profundidade (DFS)
- Gerar árvore de busca com pai e nível de cada vértice
- Descobrir componentes conexos do grafo
- Listar componentes por tamanho e vértices que pertencem a cada um
- Gerar arquivo de saída com os dados das buscas e componentes

## Como usar

```bash
python exemplos/teste.py
```

O arquivo `exemplo.txt` será carregado e `saida.txt` será gerado com as estatísticas.
