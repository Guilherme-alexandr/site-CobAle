const API_BASE = "http://127.0.0.1:5000/";

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
        if (cpf) {
            const resp = await fetch(`${API_BASE}/clientes/buscar_por_cpf/${cpf}`);
            if (resp.ok) {
                const cliente = await resp.json();
                clientes = [cliente];
            }
        } 
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
        else if (nome) {
            const resp = await fetch(`${API_BASE}/clientes/buscar_por_nome/${nome}`);
            if (resp.ok) {
                clientes = await resp.json();
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
