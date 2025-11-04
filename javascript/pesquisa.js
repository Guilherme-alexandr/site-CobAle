//const API_BASE = "https://cob-ale.onrender.com/";
const API_BASE = "http://127.0.0.1:5000/";

// ===== Função de busca =====
async function buscar() {
    const cpf = document.getElementById('cpf').value.trim();
    const nome = document.getElementById('nome').value.trim();
    const numeroContrato = document.getElementById('numeroContrato').value.trim();

    if (!cpf && !nome && !numeroContrato) {
        alert("Por favor, preencha pelo menos um campo de busca.");
        return;
    }

    try {
        let clientes = [];

        // Buscar por CPF parcial
        if (cpf) {
            const resp = await fetch(`${API_BASE}/clientes/buscar_por_cpf/${cpf}`);
            if (resp.ok) {
                const dados = await resp.json();
                // Se a API retornar um array ou objeto único, padroniza
                clientes = Array.isArray(dados) ? dados : [dados];
            }
        }

        // Buscar por número de contrato
        if (numeroContrato) {
            const respContrato = await fetch(`${API_BASE}/contratos/${numeroContrato}`);
            if (respContrato.ok) {
                const contrato = await respContrato.json();
                const respCliente = await fetch(`${API_BASE}/clientes/${contrato.cliente_id}`);
                if (respCliente.ok) {
                    const cliente = await respCliente.json();
                    if (!clientes.some(c => c.id === cliente.id)) {
                        clientes.push(cliente);
                    }
                }
            }
        }

        // Buscar por nome parcial
        if (nome) {
            const respNome = await fetch(`${API_BASE}/clientes/buscar_por_nome/${nome}`);
            if (respNome.ok) {
                let clientesPorNome = await respNome.json();

                // garante que seja sempre um array
                if (!Array.isArray(clientesPorNome)) {
                    clientesPorNome = clientesPorNome ? [clientesPorNome] : [];
                }

                // Adiciona sem duplicar
                for (const cliente of clientesPorNome) {
                    if (!clientes.some(c => c.id === cliente.id)) {
                        clientes.push(cliente);
                    }
                }
            }
        }

            if (!clientes.length) {
                alert("Nenhum resultado encontrado.");
                return;
            }

            const tbody = document.querySelector('#resultado tbody');
            tbody.innerHTML = '';

            for (const cliente of clientes) {
                const respContratos = await fetch(`${API_BASE}/contratos/buscar_por_cliente/${cliente.id}`);
                if (!respContratos.ok) continue;

                const contratos = await respContratos.json();

                for (const contrato of contratos) {
                    let statusAcordo = "Sem acordo";
                    try {
                        const respAcordo = await fetch(`${API_BASE}/acordos/buscar_por_contrato/${contrato.numero_contrato}`);
                        if (respAcordo.ok) {
                            const acordo = await respAcordo.json();
                            if (acordo && acordo.status) {
                                statusAcordo = acordo.status;
                            } else {
                                statusAcordo = "Possui acordo";
                            }
                        }
                    } catch (e) {
                        console.warn("Erro ao verificar acordo:", e);
                    }

                    const linha = document.createElement('tr');
                    linha.innerHTML = `
                    <td>${cliente.nome}</td>
                    <td>${cliente.cpf}</td>
                    <td>${contrato.numero_contrato}</td>
                    <td>R$ ${Number(contrato.valor_total).toFixed(2).replace('.', ',')}</td>
                    <td>${statusAcordo}</td>
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
            alert("Erro ao buscar os dados. Verifique o console.");
        }
    }

// ===== Tema escuro/claro =====
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

    // ===== Botões Sair e Controle =====
    const sairBtn = document.getElementById('sair-btn');
    const usuarioBtn = document.getElementById('usuario-btn');
    const contratoBtn = document.getElementById('contrato-btn');

    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) {
        window.location.href = "login.html";
    }

    if (usuario.cargo === 'gerente' || usuario.cargo === 'supervisor') {
        usuarioBtn.style.display = 'inline-block';
    }

    sairBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = "login.html";
    });

    usuarioBtn.addEventListener('click', () => {
        window.location.href = "controle_usuario.html";
    });
    contratoBtn.addEventListener('click', () => {
        window.location.href = "controle_contrato.html";
    });
