// const API_BASE = "https://cob-ale.onrender.com/";
const API_BASE = "http://127.0.0.1:5000/";

// ====================== 🔍 BUSCA PRINCIPAL ======================
async function buscar() {
    const cpf = document.getElementById('cpf')?.value.trim();
    const nome = document.getElementById('nome')?.value.trim();
    const numeroContrato = document.getElementById('numeroContrato')?.value.trim();
    const telefone = document.getElementById('telefone')?.value?.trim();
    const possuiAcordo = document.getElementById('possuiAcordo')?.value;
    const filial = document.getElementById('filial')?.value?.trim().toLowerCase();
    const valorMin = document.getElementById('valorMin')?.value;
    const valorMax = document.getElementById('valorMax')?.value;

    if (!cpf && !nome && !numeroContrato && !telefone && !possuiAcordo && !filial && !valorMin && !valorMax) {
        alert("Por favor, preencha ao menos um campo de busca ou filtro.");
        return;
    }

    const loader = document.getElementById('loader');
    loader.style.display = 'flex';

    try {
        let clientes = [];

        // ===== Buscar por CPF =====
        if (cpf) {
            const resp = await fetch(`${API_BASE}/clientes/buscar_por_cpf/${cpf}`);
            if (resp.ok) clientes = await resp.json();
        }

        // ===== Buscar por Nome =====
        else if (nome) {
            const resp = await fetch(`${API_BASE}/clientes/buscar_por_nome/${nome}`);
            if (resp.ok) clientes = await resp.json();
        }

        // ===== Buscar por Telefone =====
        else if (telefone) {
            const resp = await fetch(`${API_BASE}/clientes/buscar_por_telefone/${telefone}`);
            if (resp.ok) clientes = await resp.json();
        }

        // ===== Buscar por Número de Contrato =====
        else if (numeroContrato) {
            const respContrato = await fetch(`${API_BASE}/contratos/${numeroContrato}`);
            if (respContrato.ok) {
                const contrato = await respContrato.json();
                const respCliente = await fetch(`${API_BASE}/clientes/${contrato.cliente_id}`);
                if (respCliente.ok) {
                    const cliente = await respCliente.json();
                    clientes = [cliente];
                }
            }
        }

        // ===== Buscar por Filial =====
        else if (filial) {
            const resp = await fetch(`${API_BASE}/contratos/buscar_por_filial/${filial}`);
            if (resp.ok) {
                const contratos = await resp.json();
                for (const c of contratos) {
                    const cliResp = await fetch(`${API_BASE}/clientes/${c.cliente_id}`);
                    if (cliResp.ok) clientes.push(await cliResp.json());
                }
            }
        }

        // ===== Buscar por Faixa de Valor =====
        else if (valorMin || valorMax) {
            let url = `${API_BASE}/contratos/buscar_por_valor`;
            const params = [];
            if (valorMin) params.push(`valor_minimo=${valorMin}`);
            if (valorMax) params.push(`valor_maximo=${valorMax}`);
            if (params.length) url += `?${params.join("&")}`;

            const resp = await fetch(url);
            if (resp.ok) {
                const contratos = await resp.json();
                for (const c of contratos) {
                    const cliResp = await fetch(`${API_BASE}/clientes/${c.cliente_id}`);
                    if (cliResp.ok) clientes.push(await cliResp.json());
                }
            }
        }

        // ===== Buscar por Acordo =====
        else if (possuiAcordo) {
            const status = possuiAcordo === "sim" ? "em andamento" : "sem_acordo";
            const resp = await fetch(`${API_BASE}/acordos/buscar_por_status/${status}`);
            if (resp.ok) clientes = await resp.json();
        }

        if (!clientes || !clientes.length) {
            alert("Nenhum cliente encontrado.");
            return;
        }

        // Limpar tabela
        const tbody = document.querySelector('#resultado tbody');
        tbody.innerHTML = '';

        // Evitar duplicados
        const clientesUnicos = new Map();
        for (const c of clientes) {
            clientesUnicos.set(c.id, c);
        }

        // Montar tabela
        for (const cliente of clientesUnicos.values()) {
            const clienteId = cliente.id ?? cliente.cliente_id;
            if (!clienteId) continue;

            const respContratos = await fetch(`${API_BASE}/contratos/buscar_por_cliente/${clienteId}`);
            if (!respContratos.ok) continue;
            const contratos = await respContratos.json();

            for (const contrato of contratos) {
                const respAcordo = await fetch(`${API_BASE}/acordos/buscar_por_contrato/${contrato.numero_contrato}`);
                let acordoStatus = "Não possui";
                if (respAcordo.ok) {
                    const acordo = await respAcordo.json();
                    if (acordo && Object.keys(acordo).length) acordoStatus = "Sim";
                }

                const linha = document.createElement('tr');
                linha.innerHTML = `
                    <td><input type="checkbox"></td>
                    <td>${cliente.nome}</td>
                    <td>${cliente.cpf}</td>
                    <td>${contrato.numero_contrato}</td>
                    <td>R$ ${Number(contrato.valor_total).toFixed(2).replace('.', ',')}</td>
                    <td>${acordoStatus}</td>
                    <td>
                        <a href="../view/negociacao.html?cpf=${cliente.cpf}&contrato=${contrato.numero_contrato}" class="negociar-link">
                            Negociar
                        </a>
                    </td>
                `;
                tbody.appendChild(linha);
            }
        }

    } catch (erro) {
        console.error("Erro ao buscar:", erro);
        alert("Erro ao buscar os dados. Veja o console para mais detalhes.");
    } finally {
        loader.style.display = 'none';
    }
}


// ====================== 🧹 LIMPAR FILTROS ======================
function limparFiltros() {
    const form = document.getElementById('formPesquisa');
    if (!form) return;

    form.querySelectorAll('input, select').forEach(el => el.value = '');

    const filtrosExtrasContainer = document.getElementById('filtrosExtrasContainer');
    if (filtrosExtrasContainer) filtrosExtrasContainer.innerHTML = '';

    const tbody = document.querySelector('#resultado tbody');
    if (tbody) tbody.innerHTML = '';
}

// ====================== ⚙️ FILTROS DINÂMICOS ======================
const selectFiltro = document.getElementById('selectFiltro');
const filtrosExtrasContainer = document.getElementById('filtrosExtrasContainer');

selectFiltro.addEventListener('change', (e) => {
    const tipo = e.target.value;
    if (!tipo) return;
    adicionarCampoFiltro(tipo);
    e.target.value = '';
});

function adicionarCampoFiltro(tipo) {
    if (document.getElementById(`campo-${tipo}`)) {
        alert("Esse filtro já foi adicionado.");
        return;
    }

    const campo = document.createElement('div');
    campo.classList.add('campo');
    campo.id = `campo-${tipo}`;

    switch (tipo) {
        case 'possuiAcordo':
            campo.innerHTML = `
                <label for="possuiAcordo">Possui acordo?</label>
                <select id="possuiAcordo" name="possuiAcordo">
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                </select>
            `;
            break;

        case 'filial':
            campo.innerHTML = `
                <label for="filial">Filial</label>
                <input type="text" id="filial" name="filial" placeholder="Digite a filial">
            `;
            break;

        case 'valorTotal':
            campo.innerHTML = `
                <label>Valor total (R$)</label>
                <div style="display:flex; gap:8px; align-items:center;">
                    <input type="number" id="valorMin" placeholder="Mínimo" min="0" step="0.01">
                    <input type="number" id="valorMax" placeholder="Máximo" min="0" step="0.01">
                </div>
            `;
            break;

        case 'telefone':
            campo.innerHTML = `
                <label for="telefone">Telefone</label>
                <input type="text" id="telefone" name="telefone" placeholder="(DDD) 99999-9999">
            `;
            break;

        default:
            alert("Filtro não reconhecido.");
            return;
    }

    filtrosExtrasContainer.appendChild(campo);
    campo.classList.add('new');
    setTimeout(() => campo.classList.remove('new'), 400);
}

// ====================== 🌙 TEMA ESCURO / CLARO ======================
const toggleBtn = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme');

if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    toggleBtn.textContent = '☀️';
} else if (currentTheme === 'light') {
    document.body.classList.remove('dark-mode');
    toggleBtn.textContent = '🌙';
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
    toggleBtn.textContent = '☀️';
}

toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    toggleBtn.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// ====================== 🚪 NAVEGAÇÃO ======================
const sairBtn = document.getElementById('sair-btn');
const usuarioBtn = document.getElementById('usuario-btn');
const contratoBtn = document.getElementById('contrato-btn');

const usuario = JSON.parse(localStorage.getItem('usuario'));
if (!usuario) window.location.href = "login.html";

if (usuario.cargo === 'gerente' || usuario.cargo === 'supervisor') {
    usuarioBtn.style.display = 'inline-block';
}

sairBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = "login.html";
});

usuarioBtn.addEventListener('click', () => window.location.href = "controle_usuario.html");
contratoBtn.addEventListener('click', () => window.location.href = "controle_contrato.html");
