# Casos de Teste — Campo Minado (Tabuleiro 18 × 14, 40 Bombas)

## 1. Estrutura do Tabuleiro, Dimensões e Posicionamento de Bombas

* **CT-01:** O tabuleiro deve ter exatamente `18` linhas (índices `0` a `17`) e `14` colunas (índices `0` a `13`), totalizando `252` células.
* **CT-02:** O jogo deve posicionar exatamente `40` bombas no tabuleiro ao iniciar uma partida.
* **CT-03:** Nenhuma bomba pode ser posicionada fora dos limites do tabuleiro (`linha` menor que `0`, `linha` maior ou igual a `18`, `coluna` menor que `0` ou `coluna` maior ou igual a `14`).
* **CT-04:** Todas as `40` bombas devem ocupar posições `(linha, coluna)` distintas (sem duplicidade de coordenadas).
* **CT-05:** Na primeira jogada do jogador (`revelar(linha, coluna)`), a célula clicada e suas 8 células adjacentes (quando existentes) não devem conter bombas, garantindo abertura segura inicial e evitando morte instantânea no primeiro clique.
* **CT-06:** Cada célula sem bomba deve exibir o número exato de bombas adjacentes (`0` a `8`), considerando as 8 direções (ortogonais e diagonais).

## 2. Revelação de Células, Flood Fill (Cascata) e Limites

* **CT-07:** Coordenadas inválidas (`linha` menor que `0`, `linha` maior ou igual a `18`, `coluna` menor que `0`, `coluna` maior ou igual a `14`) devem ser rejeitadas ou ignoradas com segurança, sem lançar erro de acesso fora do índice nem alterar o estado do jogo.
* **CT-08:** Revelar uma célula com número maior que `0` deve revelar apenas aquela célula específica, exibindo sua contagem de bombas adjacentes.
* **CT-09:** Revelar uma célula vazia (`0` bombas adjacentes) deve acionar a expansão recursiva / em fila (*flood fill*), revelando todas as células adjacentes vazias conectadas e parando na borda das células numeradas (`maior que 0`), sem revelar bombas.
* **CT-10:** Células com bandeira (`bandeira = true`) não devem ser reveladas por um clique comum (`revelar`), protegendo marcações do jogador.
* **CT-11:** Tentar revelar uma célula já revelada não deve alterar o estado do tabuleiro nem incrementar jogadas inválidas.
* **CT-12:** Em células das bordas superiores, inferiores, laterais e dos 4 cantos (`(0,0)`, `(0,13)`, `(17,0)`, `(17,13)`), o cálculo de vizinhos e o *flood fill* devem considerar apenas os vizinhos válidos dentro da grade `18 × 14`.

## 3. Bandeiras (Flags), Contador de Bombas Restantes e Chord / Duplo Clique

* **CT-13:** Alternar bandeira (`alternarBandeira(linha, coluna)`) em uma célula fechada sem bandeira deve marcá-la como `bandeira = true` e decrementar o contador de bombas restantes em `1`.
* **CT-14:** Alternar bandeira novamente em uma célula já marcada deve remover a bandeira (`bandeira = false`) e incrementar o contador de bombas restantes em `1`.
* **CT-15:** Não deve ser possível colocar bandeira em uma célula já revelada.
* **CT-16:** O contador de bombas restantes pode ficar negativo caso o jogador coloque mais de `40` bandeiras (comportamento padrão de controle visual), sem corromper a contagem real de `40` bombas ocultas.
* **CT-17:** Revelar ao redor / *chord* em uma célula já revelada com número `N` (`maior que 0`): se o número de bandeiras adjacentes for igual a `N`, revela todas as células vizinhas não reveladas e sem bandeira (podendo acionar *flood fill* ou detonar bomba se a bandeira estiver errada).
* **CT-18:** Se o *chord* for acionado em uma célula revelada cuja quantidade de bandeiras adjacentes seja diferente de `N`, nenhuma célula adjacente deve ser revelada.

## 4. Condições de Derrota, Vitória, Reinício e Bloqueio Pós-Jogo

* **CT-19:** Revelar uma célula que contém bomba (sem bandeira e após a primeira jogada) deve alterar o status do jogo para `"DERROTA"`.
* **CT-20:** Ao perder (`"DERROTA"`), todas as bombas do tabuleiro devem ser reveladas para inspeção do jogador.
* **CT-21:** O jogador vence (`"VITORIA"`) quando todas as `212` células seguras (`252 - 40 = 212`) forem reveladas, independentemente de todas as `40` bandeiras terem sido colocadas.
* **CT-22:** Ao atingir `"VITORIA"`, todas as bombas restantes não marcadas devem ser automaticamente sinalizadas com bandeira (ou o contador restante exibido como `0`), conforme a regra do motor.
* **CT-23:** Após o jogo terminar (`"VITORIA"` ou `"DERROTA"`), chamadas subsequentes a `revelar`, `alternarBandeira` ou `chord` não devem modificar o tabuleiro ou o status.
* **CT-24:** Reiniciar o jogo (`reiniciar()`) deve restaurar a grade `18 × 14` com todas as células fechadas e sem bandeiras, redefinir o status para `"EM_ANDAMENTO"`, reposicionar `40` bombas e permitir nova primeira jogada segura.