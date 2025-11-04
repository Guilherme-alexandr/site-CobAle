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
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        const token = localStorage.getItem("token");

        if (!usuario || (usuario.cargo !== "supervisor" && usuario.cargo !== "gerente")) {
            alert("Acesso negado: você não tem permissão para visualizar esta página.");
            window.location.href = "pesquisa.html";
            return;
        }

        const resp = await fetch(`${API_BASE}/usuarios/listar`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const usuarios = await resp.json();
        console.log("Resposta recebida:", usuarios);

        if (!resp.ok) {
            console.error("Erro de resposta:", usuarios);
            return;
        }

        tabelaBody.innerHTML = "";
        usuarios.forEach(u => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${u.nome}</td>
                <td>${u.login}</td>
                <td>${"*".repeat(6)}</td>
                <td>${u.cargo}</td>
                <td>
                    <button class="editar" 
                        onclick="abrirEdicao(${u.id}, '${u.nome}', '${u.login}', '${u.cargo}')">
                        Editar
                    </button>
                </td>
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

    const resp = await fetch(`${API_BASE}/usuarios/atualizar/${id}`, {
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
    const resp = await fetch(`${API_BASE}/usuarios/deletar/${id}`, { method: "DELETE" });
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

    const resp = await fetch(`${API_BASE}/usuarios/criar`, {
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

document.getElementById("importarBtn").addEventListener("click", function() {
    document.getElementById("popupImportar").classList.remove("hidden");
});

function fecharPopup(id) {
    document.getElementById(id).classList.add("hidden");
}

document.getElementById("form-importar").addEventListener("submit", function(e) {
    e.preventDefault();

    const tipoImportacao = document.getElementById("tipo_importacao").value;
    const arquivo = document.getElementById("arquivo").files[0];

    if (!tipoImportacao || !arquivo) {
        exibirFeedback("erro", "Por favor, selecione o tipo de importação e o arquivo.");
        return;
    }

    const dadosImportacao = new FormData();
    dadosImportacao.append('tipo_importacao', tipoImportacao);
    dadosImportacao.append('arquivo', arquivo);

    fetch(`${API_BASE}/importar-exemplo-usuarios`, {
        method: 'GET',
        body: dadosImportacao,
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            exibirFeedback("sucesso", `${data.usuariosImportados} usuários importados com sucesso.`);
            exibirResultadoImportacao(data.resultados);
        } else {
            exibirFeedback("erro", "Erro ao importar os usuários.");
        }
    })
    .catch(error => {
        exibirFeedback("erro", "Erro ao enviar o arquivo.");
    });

    fecharPopup('popupImportar');
});

function exibirFeedback(tipo, mensagem) {
    const statusFeedback = document.getElementById('statusFeedback');
    const feedbackMessage = document.getElementById('feedbackMessage');

    feedbackMessage.textContent = mensagem;

    statusFeedback.classList.remove('sucesso', 'erro');
    statusFeedback.classList.add(tipo);

    statusFeedback.classList.remove('hidden');

    setTimeout(() => {
        statusFeedback.classList.add('hidden');
    }, 5000);
}

function exibirResultadoImportacao(resultados) {
    const tabelaResultado = document.getElementById('tabelaResultadoImportacao');
    const tbody = tabelaResultado.querySelector('tbody');
    tbody.innerHTML = '';

    resultados.forEach(resultado => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${resultado.nome}</td>
            <td>${resultado.login}</td>
            <td>${resultado.status}</td>
        `;
        tbody.appendChild(tr);
    });

    tabelaResultado.classList.remove('hidden');
}


carregarUsuarios();

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
