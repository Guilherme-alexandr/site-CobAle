const API_BASE = "http://127.0.0.1:5000";
// const API_BASE = "https://cob-ale.onrender.com/";

const tabelaBody = document.querySelector("#tabela-body");
const criarClienteBtn = document.querySelector("#criarClienteBtn");
const criarContratoBtn = document.querySelector("#criarContratoBtn");
const importarBtn = document.querySelector("#importarBtn");

const popupCliente = document.querySelector("#popupCliente");
const popupContrato = document.querySelector("#popupContrato");
const popupImportar = document.querySelector("#popupImportar");


// ===================== POPUPS =====================
function abrirPopup(popup) {
    popup.classList.remove("hidden");
}

function fecharPopup(id) {
    document.getElementById(id).classList.add("hidden");
}

document.querySelectorAll(".fechar-popup").forEach(btn => {
    btn.addEventListener("click", () => {
        btn.closest(".popup").classList.add("hidden");
    });
});


// ===================== INPUT ESTADO =====================
document.getElementById("estado").addEventListener("input", function () {
    this.value = this.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
});


// ===================== BOTÕES HEADER =====================
criarClienteBtn.addEventListener("click", () => abrirPopup(popupCliente));
criarContratoBtn.addEventListener("click", () => abrirPopup(popupContrato));
importarBtn.addEventListener("click", () => abrirPopup(popupImportar));


// ===================== CLIENTES =====================
async function criarCliente(data) {
    try {
        const token = localStorage.getItem("token");
        const resp = await fetch(`${API_BASE}/clientes/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const clienteCriado = await resp.json();
        if (!resp.ok) throw new Error(clienteCriado.erro || "Erro ao criar cliente");

        alert(`✅ Cliente "${clienteCriado.nome}" criado com sucesso!`);
        tabelaBody.innerHTML = "";
        adicionarClienteNaTabela(clienteCriado);

        fecharPopup("popupCliente");
    } catch (error) {
        console.error("Erro ao criar cliente:", error);
        alert(`❌ Erro: ${error.message}`);
    }
}

function adicionarClienteNaTabela(c) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${c.nome}</td>
        <td>${c.cpf}</td>
        <td>${c.telefone || "-"}</td>
        <td>${c.email || "-"}</td>
        <td>-</td><td>-</td><td>-</td><td>-</td>
    `;
    tabelaBody.appendChild(tr);
}

async function carregarClientes() {
    try {
        const token = localStorage.getItem("token");
        const resp = await fetch(`${API_BASE}/clientes/`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const clientes = await resp.json();
        tabelaBody.innerHTML = "";

        clientes.forEach(adicionarClienteNaTabela);
    } catch (err) {
        console.error("Erro ao carregar clientes:", err);
    }
}


// ===================== CONTRATOS =====================
async function criarContrato(data) {
    try {
        const token = localStorage.getItem("token");

        const resp = await fetch(`${API_BASE}/contratos/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const novoContrato = await resp.json();
        if (!resp.ok) throw new Error(novoContrato.erro || "Erro ao criar contrato");

        alert("✅ Contrato criado com sucesso!");
        const clienteResp = await fetch(`${API_BASE}/clientes/${novoContrato.cliente_id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const cliente = await clienteResp.json();

        const contratoComCliente = { ...novoContrato, cliente };

        tabelaBody.innerHTML = "";
        adicionarContratoNaTabela(contratoComCliente);

        fecharPopup("popupContrato");
    } catch (error) {
        console.error("Erro ao criar contrato:", error);
        alert(`❌ Erro: ${error.message}`);
    }
}

function adicionarContratoNaTabela(c) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${c.cliente?.nome || "-"}</td>
        <td>${c.cliente?.cpf || "-"}</td>
        <td>${c.cliente?.telefone || "-"}</td>
        <td>${c.cliente?.email || "-"}</td>
        <td>${c.numero_contrato || "-"}</td>
        <td>R$ ${parseFloat(c.valor_total || 0).toFixed(2)}</td>
        <td>${c.filial || "-"}</td>
        <td>${c.vencimento || "-"}</td>
    `;
    tabelaBody.appendChild(tr);
}

async function carregarContratos() {
    try {
        const token = localStorage.getItem("token");
        const resp = await fetch(`${API_BASE}/contratos/`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const contratos = await resp.json();
        tabelaBody.innerHTML = "";

        contratos.forEach(adicionarContratoNaTabela);
    } catch (err) {
        console.error("Erro ao carregar contratos:", err);
    }
}


// ===================== IMPORTAÇÃO =====================
async function importarExemplo(tipo) {
    const endpoints = {
        clientes: `${API_BASE}/importar-exemplo-cliente`,
        contratos: `${API_BASE}/importar-exemplo-contratos`,
        tudo: `${API_BASE}/importar-exemplos`
    };

    const url = endpoints[tipo];
    if (!url) {
        alert("⚠️ Tipo de importação inválido.");
        return;
    }

    try {
        const token = localStorage.getItem("token");
        const resp = await fetch(url, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await resp.json();

        if (resp.status === 403) {
            alert("⚠️ " + (data.mensagem || "Os dados já foram importados anteriormente."));
            return;
        }

        if (!resp.ok) {
            throw new Error(data.erro || "Erro desconhecido durante a importação.");
        }

        alert("✅ " + (data.mensagem || "Importação concluída com sucesso!"));

        if (tipo === "clientes") {
            await carregarClientes();
        } else if (tipo === "contratos") {
            await carregarContratos();
        } else {
            await carregarClientes();
            await carregarContratos();
        }

    } catch (err) {
        console.error("Erro ao importar:", err);
        alert(`❌ Erro: ${err.message}`);
    } finally {
        fecharPopup("popupImportar");
    }
}



// ===================== FORMULÁRIOS =====================

// Criar Cliente
document.querySelector("#form-criar-cliente").addEventListener("submit", e => {
    e.preventDefault();

    const data = {
        nome: e.target.nome.value,
        cpf: e.target.cpf.value,
        email: e.target.email.value,
        telefone: e.target.telefone.value,
        enderecos: [{
            rua: e.target.rua.value,
            numero: e.target.numero.value,
            cidade: e.target.cidade.value,
            estado: e.target.estado.value,
            cep: e.target.cep.value
        }]
    };

    criarCliente(data);
});


// Criar Contrato
document.querySelector("#form-criar-contrato").addEventListener("submit", async e => {
    e.preventDefault();

    const cpf = e.target.cpf_cliente.value;

    try {
        const token = localStorage.getItem("token");
        const respCliente = await fetch(`${API_BASE}/clientes/buscar_por_cpf/${cpf}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!respCliente.ok) throw new Error("Cliente não encontrado");

        let cliente = await respCliente.json();

        if (Array.isArray(cliente)) cliente = cliente[0];

        if (!cliente || !cliente.id) throw new Error("Resposta inválida: cliente sem ID");


        const data = {
            cliente_id: cliente.id,
            valor_total: e.target.valor_total.value,
            filial: e.target.filial.value,
            vencimento: e.target.vencimento.value
        };

        await criarContrato(data);
    } catch (error) {
        alert(`Erro: ${error.message}`);
        console.error(error);
    }
});



// Importar
document.querySelector("#form-importar").addEventListener("submit", e => {
    e.preventDefault();
    const tipo = e.target.tipo_importacao.value;
    importarExemplo(tipo);
    fecharPopup("popupImportar");
});


// ===================== OUTRAS FUNÇÕES =====================
function abrirEdicaoCliente(id) {
    alert("Editar cliente " + id);
}

function abrirEdicaoContrato(id) {
    alert("Editar contrato " + id);
}


// ===================== TEMA =====================
const themeToggle = document.getElementById("theme-toggle");

if (localStorage.getItem("tema") === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️";
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const modoEscuroAtivo = document.body.classList.contains("dark-mode");
    themeToggle.textContent = modoEscuroAtivo ? "☀️" : "🌙";
    localStorage.setItem("tema", modoEscuroAtivo ? "dark" : "light");
});
