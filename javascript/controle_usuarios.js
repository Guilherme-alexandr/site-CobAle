//const API_BASE = "https://cob-ale.onrender.com/";
const API_BASE = "http://127.0.0.1:5000";


const tabelaBody = document.querySelector("#tabelaUsuarios tbody");
const popupEdicao = document.getElementById("popupEdicao");
const popupCriar = document.getElementById("popupCriar");
const pesquisaNome = document.getElementById("pesquisaNome");
const filtroCargo = document.getElementById("filtroCargo");
const btnLimparFiltros = document.getElementById("btnLimparFiltros");

async function carregarUsuarios() {
    try {
        const resp = await fetch(`${API_BASE}/user/listar`);
        const usuarios = await resp.json();
        tabelaBody.innerHTML = "";

        usuarios.forEach(u => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
        <td>${u.nome}</td>
        <td>${u.login}</td>
        <td>${"*".repeat(6)}</td>
        <td>${u.cargo}</td>
        <td><button class="editar" onclick="abrirEdicao(${u.id}, '${u.nome}', '${u.login}', '${u.cargo}')">Editar</button></td>
      `;
            tabelaBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Erro ao carregar usuários:", err);
    }
}

function aplicarFiltros() {
  const termo = pesquisaNome.value.toLowerCase();
  const cargoSelecionado = filtroCargo.value;
  const linhas = document.querySelectorAll("#tabelaUsuarios tbody tr");

  linhas.forEach(linha => {
    const nome = linha.children[0].textContent.toLowerCase();
    const cargo = linha.children[3].textContent;

    const correspondeNome = nome.includes(termo);
    const correspondeCargo = cargoSelecionado === "" || cargo === cargoSelecionado;

    linha.style.display = (correspondeNome && correspondeCargo) ? "" : "none";
  });
}

pesquisaNome.addEventListener("input", aplicarFiltros);
filtroCargo.addEventListener("change", aplicarFiltros);

btnLimparFiltros.addEventListener("click", () => {
  pesquisaNome.value = "";
  filtroCargo.value = "";
  aplicarFiltros();
});

function abrirEdicao(id, nome, login, cargo) {
    popupEdicao.classList.remove("hidden");
    document.getElementById("editNome").value = nome;
    document.getElementById("editLogin").value = login;
    document.getElementById("editSenha").value = "";
    document.getElementById("editCargo").value = cargo;
    document.getElementById("formEdicao").onsubmit = e => salvarEdicao(e, id);
    document.getElementById("btnExcluir").onclick = () => excluirUsuario(id);
}

function fecharPopups() {
    popupEdicao.classList.add("hidden");
    popupCriar.classList.add("hidden");
}

async function salvarEdicao(e, id) {
    e.preventDefault();
    const nome = document.getElementById("editNome").value;
    const login = document.getElementById("editLogin").value;
    const senha = document.getElementById("editSenha").value;
    const cargo = document.getElementById("editCargo").value;

    const body = { nome, login, cargo };
    if (senha) body.senha = senha;

    const resp = await fetch(`${API_BASE}/user/atualizar/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (resp.ok) {
        alert("Usuário atualizado com sucesso!");
        fecharPopups();
        carregarUsuarios();
    } else {
        alert("Erro ao atualizar usuário!");
    }
}

async function excluirUsuario(id) {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    const resp = await fetch(`${API_BASE}/user/deletar/${id}`, { method: "DELETE" });
    if (resp.ok) {
        alert("Usuário excluído!");
        fecharPopups();
        carregarUsuarios();
    }
}

document.getElementById("btnCriar").addEventListener("click", () => {
    popupCriar.classList.remove("hidden");
});

document.getElementById("btnCancelar").addEventListener("click", fecharPopups);
document.getElementById("btnCancelarCriar").addEventListener("click", fecharPopups);
document.getElementById("btnVoltar").addEventListener("click", () => window.location.href = "pesquisa.html");

document.getElementById("formCriar").addEventListener("submit", async e => {
    e.preventDefault();
    const nome = document.getElementById("novoNome").value;
    const login = document.getElementById("novoLogin").value;
    const senha = document.getElementById("novaSenha").value;
    const cargo = document.getElementById("novoCargo").value;

    const resp = await fetch(`${API_BASE}/user/criar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, login, senha, cargo })
    });

    if (resp.ok) {
        alert("Usuário criado com sucesso!");
        fecharPopups();
        carregarUsuarios();
    } else {
        alert("Erro ao criar usuário!");
    }
});

carregarUsuarios();

// ===== Alternar Tema =====
const themeToggle = document.getElementById("theme-toggle");

// Verifica se o usuário já tinha um tema salvo
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
