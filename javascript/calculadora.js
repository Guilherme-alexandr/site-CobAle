console.log("calculadora.js carregado!");

let contratoGlobal = null;
let clienteIdGlobal = null;
let acordoGlobal = null;

function abrirCalculadora() {
    document.getElementById("popupCalculadora").style.display = "block";
}

function fecharCalculadora() {
    document.getElementById("popupCalculadora").style.display = "none";
}

async function simularCalculo() {
    if (!contratoGlobal) return;

    const dataVencimentoInput = document.getElementById("dataVencimento");
    const parcelasInput = document.getElementById("numeroParcelas");
    const entradaInput = document.getElementById("valorEntrada");
    const campoJuros = document.getElementById("campoJuros");
    const campoDesconto = document.getElementById("campoDesconto");
    const campoValorFinal = document.getElementById("campoValorFinal");
    const tabelaParcelas = document.getElementById("tabelaParcelas");
    const campoDiasAtraso = document.getElementById("campoDiasAtraso");
    const campoValorComJuros = document.getElementById("campoValorComJuros");

    const dataSelecionada = new Date(dataVencimentoInput.value);
    const dataContrato = new Date(contratoGlobal.vencimento);
    if (isNaN(dataSelecionada.getTime())) {
        alert("Data de vencimento inválida.");
        return;
    }

    const diasAtraso = Math.max(0, Math.floor((dataSelecionada - dataContrato) / (1000 * 60 * 60 * 24)));

    const valorEntrada = parseFloat(entradaInput.value) || 0;
    let quantidadeParcelas = parseInt(parcelasInput.value) || 0;

    let tipo_pagamento = (valorEntrada > 0 || quantidadeParcelas > 1) ? "parcelado" : "avista";

    if (tipo_pagamento === "parcelado" && quantidadeParcelas < 2) quantidadeParcelas = 2;
    if (quantidadeParcelas > 24) quantidadeParcelas = 24;

    const payload = {
        valor_original: parseFloat(contratoGlobal.valor_total) || 0,
        dias_em_atraso: diasAtraso,
        tipo_pagamento: tipo_pagamento
    };

    if (tipo_pagamento === "parcelado") {
        payload.quantidade_parcelas = quantidadeParcelas;
        if (valorEntrada > 0) {
            payload.valor_entrada = valorEntrada;
        }
    }

    console.log("Enviando para simulação:", payload);

    try {
        const resposta = await fetch(`${API_BASE}/acordos/simular`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!resposta.ok) {
            let erroMsg = "Erro na simulação";
            try {
                const erro = await resposta.json();
                erroMsg = erro.erro || erroMsg;
            } catch {}
            throw new Error(erroMsg);
        }

        const dados = await resposta.json();

        campoDiasAtraso.value = `${dados.dias_em_atraso} dia(s)`;
        campoValorComJuros.value = `R$ ${(dados.valor_original + dados.juros_total).toFixed(2)}`;
        campoJuros.value = `R$ ${dados.juros_total.toFixed(2)}`;
        campoDesconto.value = `${dados.percentual_desconto}% (R$ ${dados.valor_desconto.toFixed(2)})`;
        campoValorFinal.value = `R$ ${dados.valor_final.toFixed(2)}`;

        if (tipo_pagamento === "parcelado" && dados.parcelamento) {
            preencherTabelaParcelas(dados.parcelamento);
        } else {
            limparTabelaParcelas();
        }

    } catch (e) {
        console.error("Erro ao simular cálculo:", e);
        alert(`Erro na simulação: ${e.message}`);
    }
}




async function inicializarCalculadoraComContrato(contrato) {
    contratoGlobal = contrato;
    clienteIdGlobal = contrato.cliente_id;

    const hoje = new Date().toISOString().split("T")[0];
    document.getElementById("dataVencimento").value = hoje;

    await simularCalculo();
}

document.addEventListener("DOMContentLoaded", async () => {
    const btn = document.getElementById("AbrirCalculadora");
    const dataVencimentoInput = document.getElementById("dataVencimento");
    const parcelasInput = document.getElementById("numeroParcelas");
    const entradaInput = document.getElementById("valorEntrada");

    const params = new URLSearchParams(window.location.search);
    const numeroContrato = params.get("contrato");

    if (numeroContrato) {
        try {
            const resposta = await fetch(`${API_BASE}/contratos/${numeroContrato}`);
            if (!resposta.ok) throw new Error("Contrato não encontrado.");

            const contrato = await resposta.json();
            contratoGlobal = contrato;
            clienteIdGlobal = contrato.cliente_id;

        } catch (e) {
            console.error("Erro ao buscar contrato pela URL:", e);
            alert("Contrato inválido na URL.");
        }
    }

    if (btn) {
        btn.addEventListener("click", async () => {
            if (!contratoGlobal) {
                alert("Contrato ainda não carregado.");
                return;
            }

            abrirCalculadora();
            await inicializarCalculadoraComContrato(contratoGlobal);
        });
    }

    if (dataVencimentoInput) dataVencimentoInput.addEventListener("change", simularCalculo);
    if (parcelasInput) parcelasInput.addEventListener("input", simularCalculo);
    if (entradaInput) entradaInput.addEventListener("input", simularCalculo);
});

function preencherTabelaParcelas(parcelamento) {
    const tabelaParcelas = document.getElementById("tabelaParcelas");
    limparTabelaParcelas();

    const { quantidade_parcelas, valor_parcela, entrada } = parcelamento;
    const dataBase = new Date(document.getElementById("dataVencimento").value);

    for (let i = 0; i < quantidade_parcelas; i++) {
        const vencimento = new Date(dataBase);
        vencimento.setMonth(vencimento.getMonth() + i);

        const linha = tabelaParcelas.insertRow();
        linha.innerHTML = `
            <td>${i + 1}</td>
            <td>${vencimento.toLocaleDateString()}</td>
            <td>R$ ${valor_parcela.toFixed(2)}</td>
        `;
    }

    if (entrada > 0) {
        const entradaRow = tabelaParcelas.insertRow(0);
        entradaRow.innerHTML = `
            <td>Entrada</td>
            <td>${new Date().toLocaleDateString()}</td>
            <td>R$ ${entrada.toFixed(2)}</td>
        `;
    }
}

function limparTabelaParcelas() {
    document.getElementById("tabelaParcelas").innerHTML = "";
}

async function formalizarAcordo() {
    if (!contratoGlobal) return;

    const vencimento = document.getElementById("dataVencimento").value;
    const entrada = parseFloat(document.getElementById("valorEntrada").value) || 0;
    const parcelas = parseInt(document.getElementById("numeroParcelas").value) || 0;
    const tipo_pagamento = (entrada || parcelas > 1) ? "parcelado" : "avista";

    const payload = {
        contrato_id: contratoGlobal.numero_contrato,
        tipo_pagamento,
        qtd_parcelas: parcelas,
        valor_entrada: entrada,
        vencimento: vencimento,
    };

    try {
        const resposta = await fetch(`${API_BASE}/acordos/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!resposta.ok) throw new Error("Erro ao formalizar acordo.");

        const resultado = await resposta.json();

        fecharCalculadora();
        document.getElementById("AbrirCalculadora").style.display = "none";
        renderizarResumoAcordo(resultado);
    } catch (e) {
        console.error("Erro ao formalizar acordo:", e);
        alert(`Erro ao formalizar acordo: ${e.message}`);
    }
}

function renderizarResumoAcordo(acordo) {
    const container = document.getElementById("resultadoAcordo");

    const parcelasHtml = acordo.parcelamento ? gerarTabelaParcelas(acordo.parcelamento) : "";

    const valorTotal = acordo.valor_total || acordo.valor_final || 0;
    const diasAtraso = acordo.dias_em_atraso || 0;
    const parcelas = acordo.parcelamento?.quantidade_parcelas || acordo.qtd_parcelas || 1;

    container.innerHTML = `
        <div class="acordo-box">
            <div style="display: flex; justify-content: space-between; align-items: center; position: relative;">
            <h3>Acordo Formalizado</h3>
            <div class="acoes-wrapper">
                <button class="btn-acoes" onclick="toggleMenuAcoes()">⚙️ Ações</button>
                <div id="menuAcoesAcordo" class="menu-acoes" style="display: none; position: absolute; right: 0; top: 100%; background: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index: 10;">
                <button onclick="editarAcordo()">📝 Editar</button>
                <button onclick="deletarAcordo()">🗑️ Excluir</button>
                <button onclick="gerarBoleto(${acordo.id})">💳 Gerar Boleto</button>
                <button onclick="enviarBoleto(${acordo.id}, ${acordo.boleto_id})">📨 Enviar Boleto</button>
                </div>
            </div>
            </div>

            <p><strong>Valor total do acordo:</strong> R$ ${valorTotal.toFixed(2)}</p>
            <p><strong>Dias em atraso:</strong> ${diasAtraso} dias</p>
            <p><strong>Parcelamento:</strong> ${parcelas}x</p>

            ${parcelasHtml}
        </div>
        `;
}

function gerarTabelaParcelas(parcelamento) {
    const { quantidade_parcelas, valor_parcela, entrada } = parcelamento;

    let linhas = "";

    const hoje = new Date();
    for (let i = 0; i < quantidade_parcelas; i++) {
        const vencimento = new Date(hoje);
        vencimento.setMonth(vencimento.getMonth() + i);
        const dataFormatada = vencimento.toLocaleDateString("pt-BR");

        linhas += `
            <tr>
                <td>${i + 1}</td>
                <td>${dataFormatada}</td>
                <td>R$ ${valor_parcela.toFixed(2)}</td>
            </tr>
        `;
    }

    if (entrada > 0) {
        linhas = `
            <tr>
                <td>Entrada</td>
                <td>${hoje.toLocaleDateString("pt-BR")}</td>
                <td>R$ ${entrada.toFixed(2)}</td>
            </tr>
        ` + linhas;
    }

    return `
        <table class="tabela-acordo">
            <thead>
                <tr>
                    <th>Parcela</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                </tr>
            </thead>
            <tbody>
                ${linhas}
            </tbody>
        </table>
    `;
}

function toggleMenuAcoes() {
    const menu = document.getElementById("menuAcoesAcordo");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

async function editarAcordo() {
    toggleMenuAcoes();

    try {
        const numeroContrato = new URLSearchParams(window.location.search).get("contrato");
        const respostaAcordo = await fetch(`${API_BASE}/acordos/buscar_por_contrato/${numeroContrato}`);

        if (!respostaAcordo.ok) throw new Error("Acordo não encontrado.");

        const acordo = await respostaAcordo.json();
        window.acordoGlobal = acordo;

        document.getElementById("numeroParcelas").value = acordo.qtd_parcelas || 1;
        document.getElementById("valorEntrada").value = acordo.valor_entrada || 0;
        document.getElementById("btnFormalizar").style.display = "none";
        document.getElementById("btnSalvarEdicao").style.display = "inline-block";

        document.getElementById("popupCalculadora").style.display = "block";

    } catch (erro) {
        console.error("Erro ao carregar acordo para edição:", erro);
        alert("Erro ao carregar acordo para edição.");
    }
}

function fecharPopupEditarAcordo() {
    document.getElementById("popupEditarAcordo").style.display = "none";
}

async function salvarAcordoEditado() {
    try {
        const resposta = await fetch(`${API_BASE}/acordos/${window.acordoGlobal.id}`, {
            method: "DELETE"
        });

        if (!resposta.ok) throw new Error("Erro ao remover acordo antigo.");

        await formalizarAcordo();

        alert("Acordo atualizado com sucesso.");
        
        document.getElementById("btnSalvarEdicao").style.display = "none";
        document.getElementById("btnFormalizar").style.display = "inline-block";

    } catch (e) {
        console.error("Erro ao atualizar acordo:", e);
        alert("Erro ao atualizar acordo.");
    }
}

async function deletarAcordo() {
    toggleMenuAcoes();

    const confirmacao = confirm("Tem certeza que deseja excluir este acordo?");
    if (!confirmacao) return;

    try {
        const numeroContrato = new URLSearchParams(window.location.search).get("contrato");
        const respostaAcordo = await fetch(`${API_BASE}/acordos/buscar_por_contrato/${numeroContrato}`);
        if (!respostaAcordo.ok) throw new Error("Acordo não encontrado.");

        const acordo = await respostaAcordo.json();

        const resposta = await fetch(`${API_BASE}/acordos/${acordo.id}`, {
            method: "DELETE",
        });

        if (!resposta.ok) throw new Error("Erro ao excluir acordo.");

        alert("Acordo excluído com sucesso.");
        document.getElementById("resultadoAcordo").innerHTML = "";

        const btnCalc = document.getElementById("AbrirCalculadora");
        if (btnCalc) btnCalc.style.display = "inline-block";

    } catch (erro) {
        console.error("Erro ao excluir acordo:", erro);
        alert("Erro ao excluir o acordo.");
    }
}

async function gerarBoleto(acordoId) {
    try {
        const response = await fetch(`${API_BASE}/acordos/gerar_boleto/${acordoId}`, {
            method: "GET"
        });

        if (!response.ok) {
            throw new Error("Erro ao gerar boleto");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        window.open(url, "_blank");
    } catch (error) {
        console.error("Erro:", error);
        alert("Não foi possível gerar o boleto.");
    }
}

async function enviarBoleto(acordoId) {
    console.log("acordoId:", acordoId);

    if (!acordoId) {
        alert("Erro: acordo_id não foi informado!");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}acordos/enviar_boleto/${acordoId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        let data;
        try {
            data = await response.json();
        } catch {
            const text = await response.text();
            throw new Error(`Resposta inesperada do servidor: ${text.substring(0, 100)}...`);
        }

        if (!response.ok) {
            throw new Error(data.erro || "Erro ao enviar boleto.");
        }

        alert(data.mensagem || "Boleto enviado com sucesso!");

    } catch (error) {
        console.error("Erro ao enviar boleto:", error);
        alert(error.message || "Não foi possível enviar o boleto.");
    }
}
