console.log("calculadora.js carregado!");

let contratoGlobal = null;
let clienteIdGlobal = null;

function abrirCalculadora() {
    document.getElementById("popupCalculadora").style.display = "block";
}

function fecharCalculadora() {
    document.getElementById("popupCalculadora").style.display = "none";
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
    const campoJuros = document.getElementById("campoJuros");
    const campoDesconto = document.getElementById("campoDesconto");
    const campoValorFinal = document.getElementById("campoValorFinal");
    const tabelaParcelas = document.getElementById("tabelaParcelas");

    const params = new URLSearchParams(window.location.search);
    const numeroContrato = params.get("contrato");

    if (numeroContrato) {
        try {
            const resposta = await fetch(`http://127.0.0.1:5000/contratos/${numeroContrato}`);
            if (!resposta.ok) throw new Error("Contrato não encontrado.");

            const contrato = await resposta.json();
            contratoGlobal = contrato;
            clienteIdGlobal = contrato.cliente_id;

        } catch (e) {
            console.error("Erro ao buscar contrato pela URL:", e);
            alert("Contrato inválido na URL.");
        }
    } else {
        console.warn("Número do contrato não encontrado na URL.");
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
    } else {
        console.warn("Botão 'AbrirCalculadora' não encontrado.");
    }

    dataVencimentoInput.addEventListener("change", simularCalculo);
    parcelasInput.addEventListener("input", simularCalculo);
    entradaInput.addEventListener("input", simularCalculo);

    async function simularCalculo() {
        if (!contratoGlobal) return;

        const dataSelecionada = new Date(dataVencimentoInput.value);
        const dataContrato = new Date(contratoGlobal.vencimento);

        if (isNaN(dataSelecionada.getTime())) {
            alert("Data de vencimento inválida.");
            return;
        }

        const diasAtraso = Math.max(0, Math.floor((dataSelecionada - dataContrato) / (1000 * 60 * 60 * 24)));
        const valorEntrada = entradaInput.value ? parseFloat(entradaInput.value) : null;
        const quantidadeParcelas = parseInt(parcelasInput.value) || 0;
        const tipo_pagamento = (valorEntrada || quantidadeParcelas > 1) ? "parcelado" : "avista";

        const payload = {
            valor_original: contratoGlobal.valor_total,
            dias_em_atraso: diasAtraso,
            tipo_pagamento,
            quantidade_parcelas: quantidadeParcelas,
            valor_entrada: valorEntrada
        };

        try {
            const resposta = await fetch("http://127.0.0.1:5000/acordos/simular", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!resposta.ok) {
                const erro = await resposta.json();
                throw new Error(erro.erro || "Erro na simulação");
            }

            const dados = await resposta.json();

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

    function preencherTabelaParcelas(parcelamento) {
        limparTabelaParcelas();

        const { quantidade_parcelas, valor_parcela, entrada } = parcelamento;
        const dataBase = new Date(dataVencimentoInput.value);

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
        tabelaParcelas.innerHTML = "";
    }
});

async function formalizarAcordo() {
    if (!contratoGlobal) return;

    const vencimento = document.getElementById("dataVencimento").value;
    const entrada = parseFloat(document.getElementById("valorEntrada").value || 0);
    const parcelas = parseInt(document.getElementById("numeroParcelas").value || 0);
    const tipo_pagamento = (entrada || parcelas > 1) ? "parcelado" : "avista";

    const payload = {
        contrato_id: contratoGlobal.numero_contrato,
        tipo_pagamento,
        qtd_parcelas: parcelas,
        valor_entrada: entrada,
        vencimento
    };

    try {
        const resposta = await fetch("http://127.0.0.1:5000/acordos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!resposta.ok) {
            const erro = await resposta.json();
            throw new Error(erro.erro || "Erro ao formalizar o acordo");
        }

        const resultado = await resposta.json();
        alert("Acordo formalizado com sucesso!");
        console.log("Acordo:", resultado);
        fecharCalculadora();
    } catch (e) {
        console.error("Erro ao formalizar acordo:", e);
        alert(`Erro ao formalizar o acordo: ${e.message}`);
    }
}
