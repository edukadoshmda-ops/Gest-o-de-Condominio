import React, { useEffect } from 'react';

export const AppOrganizarTarefas = () => {
    useEffect(() => {
        // Atualiza as tags de SEO via JavaScript de forma análoga ao "metadata" do Next.js
        document.title = "App gratuito para organizar tarefas";

        // Verifica e atualiza a tag de description, se existir, senão cria uma nova.
        let metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute("content", "Ferramenta gratuita para organizar tarefas e melhorar produtividade.");
        } else {
            metaDescription = document.createElement('meta');
            metaDescription.name = "description";
            metaDescription.content = "Ferramenta gratuita para organizar tarefas e melhorar produtividade.";
            document.head.appendChild(metaDescription);
        }
    }, []);

    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800 font-sans">
            <div className="max-w-2xl bg-white p-10 md:p-14 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 text-center space-y-8 relative overflow-hidden">
                {/* Elementos decorativos (Opcional, mas dão sensação de design premium) */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />

                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-100/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                    App gratuito para organizar tarefas
                </h1>

                <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-xl mx-auto font-medium">
                    Organizar tarefas pode ser difícil quando você tem muitos projetos.
                    Ferramentas de produtividade ajudam a melhorar organização.
                </p>

                <div className="pt-6 pb-2">
                    <a
                        href="/"
                        className="inline-flex items-center justify-center px-10 py-5 text-[13px] font-black tracking-widest text-white uppercase transition-all bg-emerald-500 rounded-2xl hover:bg-emerald-600 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/30 active:translate-y-0 active:scale-95"
                    >
                        Testar Gestor 360 One
                    </a>
                </div>
            </div>
        </main>
    );
};
