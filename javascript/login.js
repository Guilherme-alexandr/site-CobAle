//const API_BASE = "https://cob-ale.onrender.com/";
const API_BASE = "http://127.0.0.1:5000/";

document.addEventListener("DOMContentLoaded", () => {
    // ======= TEMA ESCURO / CLARO =======
    const toggleBtn = document.getElementById("theme-toggle");
    const currentTheme = localStorage.getItem("theme");

    if (currentTheme === "dark") {
        document.body.classList.add("dark-mode");
        toggleBtn.textContent = "☀️";
    } else if (currentTheme === "light") {
        document.body.classList.remove("dark-mode");
        toggleBtn.textContent = "🌙";
    } else {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            document.body.classList.add("dark-mode");
            toggleBtn.textContent = "☀️";
        } else {
            toggleBtn.textContent = "🌙";
        }
    }

    toggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const isDark = document.body.classList.contains("dark-mode");
        toggleBtn.textContent = isDark ? "☀️" : "🌙";
        localStorage.setItem("theme", isDark ? "dark" : "light");
    });

    // ======= LOGIN =======
    const form = document.getElementById("loginForm");
    const mensagemDiv = document.getElementById("mensagem");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const login = document.getElementById("login").value;
        const senha = document.getElementById("senha").value;

        try {
            const response = await fetch(`${API_BASE}user/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ login, senha }),
            });

            const data = await response.json();

            if (response.ok) {
                // Salva token e dados do usuário
                localStorage.setItem("token", data.token);
                localStorage.setItem("usuario", JSON.stringify(data.usuario));

                // Redireciona todos para a página de pesquisa
                window.location.href = "pesquisa.html";
            } else {
                mensagemDiv.textContent = data.erro || "Erro ao fazer login";
            }
        } catch (err) {
            mensagemDiv.textContent = "Erro na conexão com a API";
            console.error("Erro:", err);
        }
    });
});
