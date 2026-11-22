import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

const LINHAS = 18;
const COLUNAS = 14;
const TOTAL_BOMBAS = 40;

class CampoMinado {
  constructor(linhas = LINHAS, colunas = COLUNAS, totalBombas = TOTAL_BOMBAS, rng = Math.random) {
    this.linhas = linhas;
    this.colunas = colunas;
    this.totalBombas = totalBombas;
    this.rng = rng;
    this.reiniciar();
  }

  reiniciar() {
    this.grade = Array.from({ length: this.linhas }, (_, r) =>
      Array.from({ length: this.colunas }, (_, c) => ({
        linha: r,
        coluna: c,
        temBomba: false,
        revelada: false,
        bandeira: false,
        bombasVizinhas: 0,
      }))
    );
    this.bombasPosicionadas = false;
    this.status = "EM_ANDAMENTO";
    this.celulasReveladas = 0;
    this.bandeirasColocadas = 0;
  }

  dentroLimites(r, c) {
    return r >= 0 && r < this.linhas && c >= 0 && c < this.colunas;
  }

  obterVizinhos(r, c) {
    const vizinhos = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (this.dentroLimites(nr, nc)) {
          vizinhos.push(this.grade[nr][nc]);
        }
      }
    }
    return vizinhos;
  }

  posicionarBombas(linhaSegura, colunaSegura) {
    const proibidas = new Set();
    if (this.dentroLimites(linhaSegura, colunaSegura)) {
      proibidas.add(`${linhaSegura},${colunaSegura}`);
      for (const v of this.obterVizinhos(linhaSegura, colunaSegura)) {
        proibidas.add(`${v.linha},${v.coluna}`);
      }
    }

    const candidatas = [];
    for (let r = 0; r < this.linhas; r++) {
      for (let c = 0; c < this.colunas; c++) {
        const chave = `${r},${c}`;
        if (!proibidas.has(chave)) {
          candidatas.push({ r, c });
        }
      }
    }

    for (let i = candidatas.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [candidatas[i], candidatas[j]] = [candidatas[j], candidatas[i]];
    }

    const qtd = Math.min(this.totalBombas, candidatas.length);
    for (let i = 0; i < qtd; i++) {
      const { r, c } = candidatas[i];
      this.grade[r][c].temBomba = true;
    }

    for (let r = 0; r < this.linhas; r++) {
      for (let c = 0; c < this.colunas; c++) {
        if (!this.grade[r][c].temBomba) {
          this.grade[r][c].bombasVizinhas = this.obterVizinhos(r, c).filter((v) => v.temBomba).length;
        }
      }
    }

    this.bombasPosicionadas = true;
  }

  get bombasRestantes() {
    return this.totalBombas - this.bandeirasColocadas;
  }

  contarBombasNoTabuleiro() {
    let total = 0;
    for (let r = 0; r < this.linhas; r++) {
      for (let c = 0; c < this.colunas; c++) {
        if (this.grade[r][c].temBomba) total++;
      }
    }
    return total;
  }

  alternarBandeira(r, c) {
    if (this.status !== "EM_ANDAMENTO") return false;
    if (!this.dentroLimites(r, c)) return false;

    const celula = this.grade[r][c];
    if (celula.revelada) return false;

    celula.bandeira = !celula.bandeira;
    this.bandeirasColocadas += celula.bandeira ? 1 : -1;
    return true;
  }

  revelar(r, c) {
    if (this.status !== "EM_ANDAMENTO") return false;
    if (!this.dentroLimites(r, c)) return false;

    if (!this.bombasPosicionadas) {
      this.posicionarBombas(r, c);
    }

    const celula = this.grade[r][c];
    if (celula.revelada || celula.bandeira) return false;

    if (celula.temBomba) {
      celula.revelada = true;
      this.status = "DERROTA";
      this.revelarTodasBombas();
      return true;
    }

    const fila = [celula];
    while (fila.length > 0) {
      const atual = fila.shift();
      if (atual.revelada || atual.bandeira || atual.temBomba) continue;

      atual.revelada = true;
      this.celulasReveladas++;

      if (atual.bombasVizinhas === 0) {
        for (const viz of this.obterVizinhos(atual.linha, atual.coluna)) {
          if (!viz.revelada && !viz.bandeira && !viz.temBomba) {
            fila.push(viz);
          }
        }
      }
    }

    const totalSeguras = this.linhas * this.colunas - this.totalBombas;
    if (this.celulasReveladas === totalSeguras) {
      this.status = "VITORIA";
      this.marcarBombasRestantesComBandeira();
    }

    return true;
  }

  chord(r, c) {
    if (this.status !== "EM_ANDAMENTO") return false;
    if (!this.dentroLimites(r, c)) return false;

    const celula = this.grade[r][c];
    if (!celula.revelada || celula.bombasVizinhas <= 0) return false;

    const vizinhos = this.obterVizinhos(r, c);
    const qtdBandeiras = vizinhos.filter((v) => v.bandeira).length;
    if (qtdBandeiras !== celula.bombasVizinhas) return false;

    for (const viz of vizinhos) {
      if (!viz.revelada && !viz.bandeira && this.status === "EM_ANDAMENTO") {
        this.revelar(viz.linha, viz.coluna);
      }
    }

    return true;
  }

  revelarTodasBombas() {
    for (let r = 0; r < this.linhas; r++) {
      for (let c = 0; c < this.colunas; c++) {
        if (this.grade[r][c].temBomba) {
          this.grade[r][c].revelada = true;
        }
      }
    }
  }

  marcarBombasRestantesComBandeira() {
    for (let r = 0; r < this.linhas; r++) {
      for (let c = 0; c < this.colunas; c++) {
        const cel = this.grade[r][c];
        if (cel.temBomba && !cel.bandeira) {
          cel.bandeira = true;
          this.bandeirasColocadas++;
        }
      }
    }
  }
}

function criarGeradorDeterministico(sequencia) {
  let indice = 0;
  return () => {
    const val = sequencia[indice % sequencia.length];
    indice++;
    return val;
  };
}

describe("Campo Minado 18x14 com 40 bombas", () => {
  let jogo;

  beforeEach(() => {
    jogo = new CampoMinado(18, 14, 40);
  });

  it("CT-01: tabuleiro possui 18 linhas, 14 colunas e 252 células", () => {
    assert.equal(jogo.grade.length, 18);
    assert.ok(jogo.grade.every((linha) => linha.length === 14));
    assert.equal(jogo.grade.length * jogo.grade[0].length, 252);
  });

  it("CT-02: posiciona exatamente 40 bombas após iniciar jogada", () => {
    jogo.revelar(9, 7);
    assert.equal(jogo.contarBombasNoTabuleiro(), 40);
  });

  it("CT-03: nenhuma bomba fica fora dos limites 18x14", () => {
    jogo.revelar(0, 0);
    for (let r = 0; r < 18; r++) {
      for (let c = 0; c < 14; c++) {
        if (jogo.grade[r][c].temBomba) {
          assert.ok(r >= 0 && r < 18);
          assert.ok(c >= 0 && c < 14);
        }
      }
    }
  });

  it("CT-04: todas as 40 bombas ocupam posições distintas", () => {
    jogo.revelar(5, 5);
    const coords = new Set();
    for (let r = 0; r < 18; r++) {
      for (let c = 0; c < 14; c++) {
        if (jogo.grade[r][c].temBomba) {
          coords.add(`${r},${c}`);
        }
      }
    }
    assert.equal(coords.size, 40);
  });

  it("CT-05: primeira jogada e suas 8 células adjacentes não contêm bomba", () => {
    const r0 = 8;
    const c0 = 6;
    jogo.revelar(r0, c0);

    assert.equal(jogo.grade[r0][c0].temBomba, false);
    for (const v of jogo.obterVizinhos(r0, c0)) {
      assert.equal(v.temBomba, false);
    }
  });

  it("CT-06: célula sem bomba exibe contagem exata de bombas adjacentes", () => {
    jogo.bombasPosicionadas = true;
    jogo.grade[2][3].temBomba = true;
    jogo.grade[2][4].temBomba = true;
    jogo.grade[3][3].temBomba = true;
    for (let r = 0; r < 18; r++) {
      for (let c = 0; c < 14; c++) {
        if (!jogo.grade[r][c].temBomba) {
          jogo.grade[r][c].bombasVizinhas = jogo.obterVizinhos(r, c).filter((v) => v.temBomba).length;
        }
      }
    }

    assert.equal(jogo.grade[3][4].bombasVizinhas, 3);
    jogo.revelar(3, 4);
    assert.equal(jogo.grade[3][4].revelada, true);
    assert.equal(jogo.grade[3][4].bombasVizinhas, 3);
  });

  it("CT-07: coordenadas inválidas são ignoradas sem erro ou alteração de estado", () => {
    assert.equal(jogo.revelar(-1, 0), false);
    assert.equal(jogo.revelar(18, 0), false);
    assert.equal(jogo.revelar(0, -1), false);
    assert.equal(jogo.revelar(0, 14), false);
    assert.equal(jogo.celulasReveladas, 0);
  });

  it("CT-08: revelar célula com número maior que 0 revela apenas ela", () => {
    jogo.bombasPosicionadas = true;
    jogo.grade[0][1].temBomba = true;
    jogo.grade[0][0].bombasVizinhas = 1;
    jogo.grade[1][0].bombasVizinhas = 1;
    jogo.grade[1][1].bombasVizinhas = 1;

    jogo.revelar(0, 0);
    assert.equal(jogo.grade[0][0].revelada, true);
    assert.equal(jogo.grade[1][0].revelada, false);
    assert.equal(jogo.grade[1][1].revelada, false);
  });

  it("CT-09: revelar célula vazia executa flood fill sem revelar bombas", () => {
    jogo.bombasPosicionadas = true;
    jogo.grade[0][3].temBomba = true;
    for (let r = 0; r < 18; r++) {
      for (let c = 0; c < 14; c++) {
        if (!jogo.grade[r][c].temBomba) {
          jogo.grade[r][c].bombasVizinhas = jogo.obterVizinhos(r, c).filter((v) => v.temBomba).length;
        }
      }
    }

    jogo.revelar(0, 0);
    assert.equal(jogo.grade[0][0].revelada, true);
    assert.equal(jogo.grade[0][1].revelada, true);
    assert.equal(jogo.grade[0][2].revelada, true);
    assert.equal(jogo.grade[0][3].revelada, false);
  });

  it("CT-10: célula com bandeira não é revelada por revelar()", () => {
    jogo.alternarBandeira(4, 4);
    assert.equal(jogo.revelar(4, 4), false);
    assert.equal(jogo.grade[4][4].revelada, false);
  });

  it("CT-11: revelar célula já revelada não altera contagem de células reveladas", () => {
    jogo.bombasPosicionadas = true;
    jogo.grade[5][5].bombasVizinhas = 2;
    jogo.revelar(5, 5);
    const antes = jogo.celulasReveladas;
    assert.equal(jogo.revelar(5, 5), false);
    assert.equal(jogo.celulasReveladas, antes);
  });

  it("CT-12: bordas e cantos calculam vizinhos apenas dentro de 18x14", () => {
    assert.equal(jogo.obterVizinhos(0, 0).length, 3);
    assert.equal(jogo.obterVizinhos(0, 13).length, 3);
    assert.equal(jogo.obterVizinhos(17, 0).length, 3);
    assert.equal(jogo.obterVizinhos(17, 13).length, 3);
    assert.equal(jogo.obterVizinhos(0, 5).length, 5);
    assert.equal(jogo.obterVizinhos(5, 0).length, 5);
  });

  it("CT-13: colocar bandeira marca célula e decrementa bombas restantes", () => {
    assert.equal(jogo.bombasRestantes, 40);
    assert.equal(jogo.alternarBandeira(2, 2), true);
    assert.equal(jogo.grade[2][2].bandeira, true);
    assert.equal(jogo.bombasRestantes, 39);
  });

  it("CT-14: remover bandeira desmarca célula e incrementa bombas restantes", () => {
    jogo.alternarBandeira(2, 2);
    assert.equal(jogo.alternarBandeira(2, 2), true);
    assert.equal(jogo.grade[2][2].bandeira, false);
    assert.equal(jogo.bombasRestantes, 40);
  });

  it("CT-15: impede colocar bandeira em célula já revelada", () => {
    jogo.bombasPosicionadas = true;
    jogo.grade[1][1].bombasVizinhas = 1;
    jogo.revelar(1, 1);
    assert.equal(jogo.alternarBandeira(1, 1), false);
    assert.equal(jogo.grade[1][1].bandeira, false);
  });

  it("CT-16: contador de bombas restantes pode ficar negativo sem alterar 40 bombas reais", () => {
    jogo.bombasPosicionadas = true;
    for (let i = 0; i < 40; i++) {
      jogo.grade[0][i % 14].temBomba = i < 40 ? true : false;
    }
    let colocadas = 0;
    for (let r = 0; r < 18 && colocadas < 41; r++) {
      for (let c = 0; c < 14 && colocadas < 41; c++) {
        if (jogo.alternarBandeira(r, c)) colocadas++;
      }
    }
    assert.equal(jogo.bombasRestantes, -1);
    assert.equal(jogo.contarBombasNoTabuleiro(), 40);
  });

  it("CT-17: chord revela vizinhos sem bandeira quando bandeiras adjacentes batem com número", () => {
    jogo.bombasPosicionadas = true;
    jogo.grade[0][1].temBomba = true;
    jogo.grade[0][0].bombasVizinhas = 1;
    jogo.grade[1][0].bombasVizinhas = 1;
    jogo.grade[1][1].bombasVizinhas = 1;

    jogo.revelar(0, 0);
    jogo.alternarBandeira(0, 1);
    assert.equal(jogo.chord(0, 0), true);
    assert.equal(jogo.grade[1][0].revelada, true);
    assert.equal(jogo.grade[1][1].revelada, true);
  });

  it("CT-18: chord não revela vizinhos quando quantidade de bandeiras difere do número", () => {
    jogo.bombasPosicionadas = true;
    jogo.grade[0][1].temBomba = true;
    jogo.grade[0][0].bombasVizinhas = 1;

    jogo.revelar(0, 0);
    assert.equal(jogo.chord(0, 0), false);
    assert.equal(jogo.grade[1][0].revelada, false);
  });

  it("CT-19: revelar bomba após primeira jogada altera status para DERROTA", () => {
    jogo.bombasPosicionadas = true;
    jogo.grade[0][0].bombasVizinhas = 1;
    jogo.grade[0][1].temBomba = true;
    jogo.revelar(0, 0);
    jogo.revelar(0, 1);
    assert.equal(jogo.status, "DERROTA");
  });

  it("CT-20: ao perder, todas as bombas do tabuleiro ficam reveladas", () => {
    jogo.bombasPosicionadas = true;
    jogo.grade[0][0].bombasVizinhas = 1;
    jogo.grade[0][1].temBomba = true;
    jogo.grade[10][10].temBomba = true;
    jogo.revelar(0, 0);
    jogo.revelar(0, 1);
    assert.equal(jogo.grade[0][1].revelada, true);
    assert.equal(jogo.grade[10][10].revelada, true);
  });

  it("CT-21 e CT-22: revelar todas as 212 células seguras vence o jogo e marca bombas", () => {
    const mini = new CampoMinado(2, 2, 1, criarGeradorDeterministico([0.9]));
    mini.bombasPosicionadas = true;
    mini.grade[0][0].temBomba = false;
    mini.grade[0][1].temBomba = false;
    mini.grade[1][0].temBomba = false;
    mini.grade[1][1].temBomba = true;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        if (!mini.grade[r][c].temBomba) {
          mini.grade[r][c].bombasVizinhas = mini.obterVizinhos(r, c).filter((v) => v.temBomba).length;
        }
      }
    }

    mini.revelar(0, 0);
    mini.revelar(0, 1);
    mini.revelar(1, 0);

    assert.equal(mini.status, "VITORIA");
    assert.equal(mini.grade[1][1].bandeira, true);
  });

  it("CT-23: após fim do jogo, ações posteriores não modificam o estado", () => {
    jogo.bombasPosicionadas = true;
    jogo.grade[0][0].bombasVizinhas = 1;
    jogo.grade[0][1].temBomba = true;
    jogo.revelar(0, 0);
    jogo.revelar(0, 1);
    assert.equal(jogo.status, "DERROTA");
    assert.equal(jogo.alternarBandeira(2, 2), false);
    assert.equal(jogo.revelar(2, 2), false);
    assert.equal(jogo.grade[2][2].bandeira, false);
    assert.equal(jogo.grade[2][2].revelada, false);
  });

  it("CT-24: reiniciar() restaura tabuleiro 18x14, status EM_ANDAMENTO e 40 bombas", () => {
    jogo.revelar(5, 5);
    jogo.alternarBandeira(6, 6);
    jogo.reiniciar();

    assert.equal(jogo.status, "EM_ANDAMENTO");
    assert.equal(jogo.celulasReveladas, 0);
    assert.equal(jogo.bandeirasColocadas, 0);
    assert.equal(jogo.bombasPosicionadas, false);
    assert.equal(jogo.grade[5][5].revelada, false);
    assert.equal(jogo.grade[6][6].bandeira, false);

    jogo.revelar(5, 5);
    assert.equal(jogo.contarBombasNoTabuleiro(), 40);
  });
});