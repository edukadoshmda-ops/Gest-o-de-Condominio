import React from 'react';

export const metadata = {
    title: "Título com palavra-chave principal",
    description: "Descrição clara do que o app faz, incluindo palavras-chave",
    keywords: [
        "app de gestão",
        "organizar tarefas",
        "produtividade",
        "gestor de projetos",
        "task manager"
    ],
};

export default function Home() {
    return (
        <main>
            <h1>Gestor 360 One</h1>
            <p>Bem-vindo ao app gratuito para organizar tarefas e projetos.</p>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="/app-organizar-tarefas">Organizar tarefas</a>
                <a href="/app-produtividade">App produtividade</a>
                <a href="/gestor-projetos">Gestor de projetos</a>
            </nav>
        </main>
    );
}
