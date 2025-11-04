//const API_BASE = "https://cob-ale.onrender.com/";
const API_BASE = "http://127.0.0.1:5000";


const tabelaBody = document.querySelector("#tabela-body");
const criarClienteBtn = document.querySelector("#criarClienteBtn");
const criarContratoBtn = document.querySelector("#criarContratoBtn");
const importarBtn = document.querySelector("#importarBtn"); // ✅ corrigido

const popupCliente = document.querySelector("#popupCliente");
const popupContrato = document.querySelector("#popupContrato");
const popupImportar = document.querySelector("#popupImportar");

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

criarClienteBtn.addEventListener("click", () => abrirPopup(popupCliente));
criarContratoBtn.addEventListener("click", () => abrirPopup(popupContrato));
importarBtn.addEventListener("click", () => abrirPopup(popupImportar));

// ------------------ CLIENTE ------------------
async function criarCliente(data) {
    try {
        const token = localStorage.getItem("token");
        const resp = await fetch(`${API_BASE}/clientes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const resData = await resp.json();
        if (!resp.ok) throw new Error(resData.message || "Erro ao criar cliente");
        alert("Cliente criado com sucesso!");
        carregarClientes();
        fecharPopup("popupCliente");
    } catch (error) {
        console.error("Erro ao criar cliente:", error);
        alert(`Erro: ${error.message}`);
    }
}

// ------------------ CONTRATO ------------------
async function criarContrato(data) {
    try {
        const token = localStorage.getItem("token");
        const resp = await fetch(`${API_BASE}/contratos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        const resData = await resp.json();
        if (!resp.ok) throw new Error(resData.message || "Erro ao criar contrato");
        alert("Contrato criado com sucesso!");
        carregarContratos();
        fecharPopup("popupContrato");
    } catch (error) {
        console.error("Erro ao criar contrato:", error);
        alert(`Erro: ${error.message}`);
    }
}

// ------------------ IMPORTAÇÃO ------------------
async function importarExemplo(tipo) {
    let url;
    switch (tipo) {
        case "clientes":
            url = `${API_BASE}/importar-exemplo-cliente`;
            break;
        case "contratos":
            url = `${API_BASE}/importar-exemplo-contratos`;
            break;
        case "tudo":
            url = `${API_BASE}/importar-exemplos`;
            break;
        default:
            alert("Tipo inválido");
            return;
    }

    try {
        const token = localStorage.getItem("token");
        const resp = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.erro || data.mensagem);
        alert(data.mensagem);
        carregarClientes();
        carregarContratos();
    } catch (err) {
        alert(`Erro: ${err.message}`);
    }
}

// ------------------ CARREGAR DADOS ------------------
async function carregarClientes() {
    try {
        const token = localStorage.getItem("token");
        const resp = await fetch(`${API_BASE}/clientes/`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const clientes = await resp.json();
        tabelaBody.innerHTML = "";

        clientes.forEach(c => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${c.nome}</td>
                <td>${c.cpf}</td>
                <td>${c.telefone || "-"}</td>
                <td>${c.email || "-"}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
            `;
            tabelaBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Erro ao carregar clientes:", err);
    }
}

async function carregarContratos() {
    try {
        const token = localStorage.getItem("token");
        const resp = await fetch(`${API_BASE}/contratos/`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const contratos = await resp.json();
        tabelaBody.innerHTML = "";

        contratos.forEach(c => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${c.cliente?.nome || "-"}</td>
                <td>${c.cliente?.cpf || "-"}</td>
                <td>${c.cliente?.telefone || "-"}</td>
                <td>${c.cliente?.email || "-"}</td>
                <td>${c.numero_contrato || "-"}</td>
                <td>R$ ${c.valor_total?.toFixed(2) || "-"}</td>
                <td>${c.filial || "-"}</td>
                <td>${c.vencimento || "-"}</td>
            `;
            tabelaBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Erro ao carregar contratos:", err);
    }
}

// ------------------ FORMULÁRIOS ------------------
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

document.querySelector("#form-criar-contrato").addEventListener("submit", e => {
    e.preventDefault();
    const data = {
        cpf_cliente: e.target.cpf_cliente.value,
        valor_total: e.target.valor_total.value,
        filial: e.target.filial.value,
        vencimento: e.target.vencimento.value
    };
    criarContrato(data);
});

document.querySelector("#form-importar").addEventListener("submit", e => {
    e.preventDefault();
    const tipo = e.target.tipo_importacao.value;
    importarExemplo(tipo);
    fecharPopup("popupImportar");
});


function abrirEdicaoCliente(id) { alert("Editar cliente " + id); }
function abrirEdicaoContrato(id) { alert("Editar contrato " + id); }


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
