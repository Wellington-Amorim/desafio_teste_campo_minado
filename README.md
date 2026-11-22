## 1. Especificação do Desafio

O projeto consiste na modelagem e validação de um motor de **Campo Minado** configurado especificamente para um tabuleiro de **18 linhas por 14 colunas** (`252` células no total) contendo exatamente **40 bombas**.

### Regras e Comportamentos Especificados
* **Grade e Bombas:** Tabuleiro `18 × 14` com `40` bombas distribuídas sem repetição de coordenadas e dentro dos limites da grade.
* **Primeira Jogada Segura:** O posicionamento das bombas ocorre na primeira revelação, garantindo que a célula clicada e suas 8 células adjacentes válidas fiquem livres de bombas.
* **Contagem de Adjacência e Expansão (*Flood Fill*):** Células seguras exibem a quantidade de bombas vizinhas (`0` a `8`). Revelar uma célula com `0` bombas vizinhas propaga automaticamente a abertura para células vazias adjacentes até a fronteira de células numeradas.
* **Bandeiras e *Chord*:** Permite marcar e desmarcar células fechadas com bandeira, atualizando o contador de bombas restantes, além de executar abertura em bloco (*chord*) quando o número de bandeiras ao redor coincide com o valor da célula revelada.
* **Condições de Encerramento e Reinício:** O jogo termina em **derrota** ao revelar uma bomba ou em **vitória** ao revelar todas as `212` células seguras (`252 - 40`), bloqueando jogadas após o término e permitindo reinício completo do estado.

---

## 2. Funcionamento dos Casos de Teste

Os testes foram escritos em **JavaScript** utilizando o executor nativo do Node.js (`node:test` e `node:assert/strict`), sem dependências externas, com cada caso de teste (`CT-01` a `CT-24`) mapeado para uma verificação automatizada.

### Organização e Execução
* **Isolamento de Estado:** Antes de cada teste (`beforeEach`), uma nova instância de `CampoMinado` (`18 × 14`, `40` bombas) é criada para evitar interferência entre cenários.
* **Cobertura dos Casos de Teste:**
  * `CT-01` a `CT-06`: Dimensões `18 × 14`, quantidade de `40` bombas, limites, unicidade de coordenadas, primeira jogada segura e contagem de vizinhos.
  * `CT-07` a `CT-12`: Tratamento de coordenadas fora da grade, revelação de células numeradas, *flood fill*, bloqueio de células com bandeira, repetição de clique e bordas/cantos.
  * `CT-13` a `CT-18`: Alternância de bandeiras, contador de bombas restantes, proibição de bandeira em célula revelada e comportamento do *chord*.
  * `CT-19` a `CT-24`: Derrota ao clicar em bomba, revelação de todas as bombas na derrota, vitória ao abrir as `212` células seguras, bloqueio pós-jogo e reinício (`reiniciar()`).
* **Execução:**

```bash
node --test campo_minado.test.js
```

### by:Wellington