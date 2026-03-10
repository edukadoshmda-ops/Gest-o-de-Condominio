import React, { useEffect } from 'react';

export const AppProdutividade = () => {
    useEffect(() => {
        document.title = "App de produtividade gratuito";

        let metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute("content", "Ferramenta online para melhorar produtividade e organizar tarefas.");
        } else {
            metaDescription = document.createElement('meta');
            metaDescription.name = "description";
            metaDescription.content = "Ferramenta online para melhorar produtividade e organizar tarefas.";
            document.head.appendChild(metaDescription);
        }
    }, []);

    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800 font-sans">
            <div className="max-w-2xl bg-white p-10 md:p-14 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 text-center space-y-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-sky-500 to-blue-600" />

                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                    App de produtividade
                </h1>

                <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-xl mx-auto font-medium">
                    Melhorar produtividade no trabalho depende de organização e controle de tarefas. Usar um aplicativo de produtividade ajuda a gerenciar melhor o tempo.
                </p>

                <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-xl mx-auto font-medium">
                    O Gestor 360 One permite organizar tarefas, projetos e melhorar produtividade de forma simples.
                </p>

                <div className="pt-6 pb-2">
                    <a
                        href="/"
                        className="inline-flex items-center justify-center px-10 py-5 text-[13px] font-black tracking-widest text-white uppercase transition-all bg-blue-500 rounded-2xl hover:bg-blue-600 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/30 active:translate-y-0 active:scale-95"
                    >
                        Testar Gestor 360 One
                    </a>
                </div>
            </div>
        </main>
    );
};
