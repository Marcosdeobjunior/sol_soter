// =========================================================================
        // CONFIGURAÇÕES E DADOS GLOBAIS
        // =========================================================================
        const profanityList = ['damn','hell','shit','fuck','fucking','fucked','ass','asshole','bitch','bastard','dick','dumbass','piss','pissed','bullshit','goddamn','goddam','whore','slut','porra','caralho','merda','puta','filho da puta','fdp','desgraça','desgraçado','droga','maldito','maldita','inferno','diabos','raios','caramba','cacete','porcaria','imbecil','idiota','burro','burrão','corno','cornudo','vagabundo','miserável','bastardo','canalha','safado','safada','prostituta'];
        const stopWords = ['a','able','about','across','after','all','almost','also','am','among','an','and','any','are','as','at','be','because','been','but','by','can','cannot','could','dear','did','do','does','either','else','ever','every','for','from','get','got','had','has','have','he','her','hers','him','his','how','however','i','if','in','into','is','it','its','just','least','let','like','likely','may','me','might','most','must','my','neither','no','nor','not','of','off','often','on','only','or','other','our','own','rather','said','say','says','she','should','since','so','some','than','that','the','their','them','then','there','these','they','this','tis','to','too','twas','us','wants','was','we','were','what','when','where','which','while','who','whom','why','will','with','would','yet','you','your','o','a','os','as','um','uma','uns','umas','de','do','da','dos','das','em','no','na','nos','nas','por','pelo','pela','pelos','pelas','com','para','pra','pro','pras','pros','sem','sob','sobre','mas','ou','e','se','porque','pois','como','quando','onde','que','quem','qual','cujo','cuja','cujos','cujas','este','esta','estes','estas','esse','essa','esses','essas','aquele','aquela','aqueles','aquelas','isso','isto','aquilo','meu','minha','meus','minhas','teu','tua','teus','tuas','seu','sua','seus','suas','nosso','nossa','nossos','nossas','vosso','vossa','vossos','vossas','eu','tu','ele','ela','nós','vós','eles','elas','mim','ti','si','conosco','convosco','me','te','se','lhe','lhes','nos','vos','ser','estar','ter','haver','fazer','ir','vir','poder','saber','dizer','querer','ver','dar','falar','ficar','dever','parecer','mais','menos','muito','pouco','tão','quanto','como','assim','também','já','ainda','agora','hoje','ontem','amanhã','sempre','nunca','talvez','sim','não','aqui','ali','lá','cá','perto','longe','acima','abaixo','antes','depois','até','contra','desde','entre','perante','após','sob','ante'];
        const positiveWords = {'en': ['love','loved','beautiful','amazing','great','good','happy','happiness','joy','smile','laugh','fun','perfect','awesome','excellent','fantastic','brilliant','incredible','nice','kind','sweet','peaceful','bright','sunny','hope','dream','success','win','victory','strong','brave','proud','grateful','friend','family','together','peace','freedom','alive','life','dance','music','sing','play','care','heal','energy','shine','glow','warm','comfort','safe','trust','believe','inspire','motivate','support','help','true','real','beauty','grace'], 'pt': ['amor','amado','lindo','maravilhoso','ótimo','bom','boa','feliz','felicidade','alegre','alegria','sorriso','riso','diversão','divertido','perfeito','incrível','fantástico','excelente','brilhante','agradável','gentil','doce','paz','pacífico','brilhante','ensolarado','esperança','sonho','sucesso','vitória','ganhar','forte','corajoso','orgulhoso','grato','amigo','família','juntos','unidos','paz','liberdade','livre','vivo','vida','dança','música','cantar','tocar','cuidar','curar','energia','brilhar','brilho','calor','conforto','seguro','confiar','acreditar','inspirar','motivar','apoiar','ajudar','verdade','real','beleza','graça']};
        const negativeWords = {'en': ['hate','hated','sad','sadness','unhappy','depressed','gloomy','dark','evil','bad','terrible','awful','horrible','ugly','disgusting','pain','painful','hurt','ache','suffer','agony','torture','torment','misery','miserable','despair','hopeless','lonely','alone','abandoned','forsaken','isolated','rejected','betrayal','fear','scared','afraid','terror','horror','angry','anger','rage','fury','mad','crazy','insane','lost','confused','broken','shattered','cry','crying','tear','tears','scream','shout','fight','war','battle','kill','killed','die','dying','dead','death','grave','tomb','hell','demon','devil','monster','nightmare','trap','prison','jail','chains','lost','fail','failure','lose','lost','weak','weakness','sick','ill','disease','poison','toxic','danger','dangerous','risk','threat','lie','liar','fake','false','cheat','steal','crime','guilt','shame','regret','sorry','blame','fault','mistake','wrong','badly','poor','empty','cold','freeze','frozen','storm','rain','blood','bloody','wound','scar','burn','fire','end','never','nothing','nobody','nowhere'], 'pt': ['ódio','odiar','triste','tristeza','infeliz','deprimido','depressão','sombrio','escuro','escuridão','mal','mau','má','terrível','horrível','feio','nojento','dor','doloroso','ferido','machucado','sofrer','sofrimento','agonia','tortura','tormento','miséria','miserável','desespero','sem esperança','sozinho','solitário','abandonado','rejeitado','traição','medo','assustado','pavor','horror','raiva','ódio','fúria','louco','insano','perdido','confuso','quebrado','chorar','choro','lágrima','gritar','luta','guerra','batalha','matar','morrer','morto','morte','inferno','demônio','diabo','monstro','pesadelo','armadilha','prisão','correntes','falha','fracasso','perder','perdido','fraco','fraqueza','doente','doença','veneno','tóxico','perigo','perigoso','risco','ameaça','mentira','mentiroso','falso','errado','roubar','crime','culpa','vergonha','arrependimento','desculpa','erro','pobre','vazio','frio','congelado','tempestade','chuva','sangue','ferida','cicatriz','queimar','fogo','fim','nunca','nada','ninguém','lugar nenhum']};
        
        let currentAnalysisData = null; 

        // =========================================================================
        // FUNÇÕES DE ANÁLISE
        // =========================================================================

        function detectLanguage(text) {
            const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
            if (words.length < 10) return 'unknown'; 
            let enScore = 0, ptScore = 0;
            const commonEN = new Set(['the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you','do','at','is','my','me','like','so','just','get','up','go','know']);
            const commonPT = new Set(['o','a','de','que','e','do','da','em','um','para','é','com','não','uma','os','no','se','na','por','mais','as','dos','como','mas','foi','ao','ele','das','tem','à']);
            words.forEach(word => { if (commonEN.has(word)) enScore++; if (commonPT.has(word)) ptScore++; });
            return enScore > (ptScore * 0.8) ? 'en' : 'pt';
        }

        function analyzeProfanity(text) {
            const textLower = text.toLowerCase();
            const foundProfanities = new Map();
            let profanityCount = 0;
            const profanitySet = new Set(profanityList);
            const words = textLower.match(/\b(\w+)\b/g) || [];
            words.forEach(word => { if (profanitySet.has(word)) { profanityCount++; foundProfanities.set(word, (foundProfanities.get(word) || 0) + 1); } });
            let level = 'low';
            if (profanityCount > 10) level = 'high'; else if (profanityCount > 3) level = 'medium';
            return { hasProfanity: profanityCount > 0, count: profanityCount, level: level, wordsMap: foundProfanities };
        }

        function analyzeSentiment(text, lang) {
            const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
            let positiveScore = 0, negativeScore = 0;
            const posWords = new Set(positiveWords[lang] || []);
            const negWords = new Set(negativeWords[lang] || []);
            words.forEach(word => { if (posWords.has(word)) positiveScore++; if (negWords.has(word)) negativeScore++; });
            const totalScore = positiveScore + negativeScore;
            if (totalScore === 0) return { score: 0, label: 'Neutro', positivePercent: 50, negativePercent: 50, positiveScore: 0, negativeScore: 0 };
            const score = (positiveScore - negativeScore) / totalScore;
            let label = 'Neutro';
            if (score > 0.1) label = 'Positivo'; else if (score < -0.1) label = 'Negativo';
            const positivePercent = Math.round((positiveScore / totalScore) * 100);
            const negativePercent = 100 - positivePercent; // Assuming neutral is minimal or zero for simplicity here
            return { score, label, positiveScore, negativeScore, totalScore, positivePercent, negativePercent };
        }

        function extractKeywords(text, limit = 15) {
            const words = text.toLowerCase().match(/\b(\w{3,})\b/g) || [];
            const wordCounts = new Map();
            const stopWordsSet = new Set(stopWords);
            words.forEach(word => { if (!stopWordsSet.has(word) && isNaN(word)) { wordCounts.set(word, (wordCounts.get(word) || 0) + 1); } });
            const sortedWords = Array.from(wordCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit);
            return sortedWords;
        }

        function findChorus(text, minLines = 3, minRepetitions = 2) {
            const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 5);
            if (lines.length < minLines * minRepetitions) return null;
            const potentialChoruses = new Map();
            for (let i = 0; i <= lines.length - minLines; i++) {
                const block = lines.slice(i, i + minLines).join('\n');
                potentialChoruses.set(block, (potentialChoruses.get(block) || 0) + 1);
            }
            let mostRepeatedBlock = null, maxCount = 0;
            potentialChoruses.forEach((count, block) => { if (count >= minRepetitions && count > maxCount) { maxCount = count; mostRepeatedBlock = block; } });
            return mostRepeatedBlock ? { text: mostRepeatedBlock, repetitions: maxCount } : null;
        }

        function generateBasicSummary(lang, keywords, sentiment) {
            const topKeywords = keywords.slice(0, 3).map(([word, count]) => word);
            let summary = '';
            const sentimentLabel = sentiment.label.toLowerCase();

            if (lang === 'pt') {
                summary = `Esta música aparenta ter um tom predominantemente **${sentimentLabel}**. `;
                if (topKeywords.length > 0) {
                    summary += `Os temas recorrentes sugerem foco em **${topKeywords.join(', ')}**.`;
                } else {
                    summary += ` Não foram identificados temas principais claros através das palavras-chave.`;
                }
            } else { 
                summary = `This song seems to have a predominantly **${sentimentLabel}** tone. `;
                 if (topKeywords.length > 0) {
                    summary += `Recurring themes suggest a focus on **${topKeywords.join(', ')}**.`;
                } else {
                    summary += ` No clear main themes were identified from the keywords.`;
                }
            }
            return summary + " <br><small>(Resumo básico gerado automaticamente.)</small>";
        }

        // =========================================================================
        // FUNÇÕES DE API E UTILITÁRIOS
        // =========================================================================

        async function translateWithMyMemory(text, sourceLang = 'en', targetLang = 'pt') {
            if (!text) return { success: false, message: "Texto vazio."};
            
            // REMOVIDAS as linhas de truncamento para permitir tradução completa.
            // Isso aumenta o risco de a API MyMemory falhar para textos longos
            // ou por limites de uso gratuito.

            try {
                const email = "lyrics_analyzer_" + Date.now() + "@example.com"; 
                const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}&de=${email}`);
                
                if (!response.ok) {
                     let errorDetails = 'Erro desconhecido da API';
                     try { const errorData = await response.json(); errorDetails = errorData?.responseDetails || errorDetails; } catch(_) {}
                     throw new Error(`MyMemory API error: ${response.status} - ${errorDetails}`);
                }
                const data = await response.json();
                
                if (data.responseStatus === 200) {
                    let translatedText = data.responseData.translatedText;
                    translatedText = translatedText.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
                    
                    // REMOVIDO o aviso de truncamento.
                    
                    return { success: true, translatedText: translatedText };
                } else {
                    console.warn('MyMemory translation issue:', data.responseDetails);
                    if (data.responseDetails && (data.responseDetails.toLowerCase().includes('limit') || data.responseDetails.toLowerCase().includes('quota'))) {
                         return { success: false, message: "Limite de traduções gratuitas da API MyMemory atingido. Tente novamente mais tarde." };
                    }
                    return { success: false, message: `Falha na tradução: ${data.responseDetails || 'Erro desconhecido'}` }; 
                }
            } catch (error) {
                console.error('Erro na chamada da API MyMemory:', error);
                return { success: false, message: `Erro ao conectar com a API de tradução: ${error.message}` };
            }
        }

        async function searchLyrics(artist, song) {
            setMessage('Buscando letra...', 'info', true);
            try {
                // Tenta lyrics.ovh primeiro
                let response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`);
                let data;

                if (response.ok) {
                    data = await response.json();
                    if (data.lyrics) {
                         const cleanedLyrics = data.lyrics.replace(/^.*?\n/, '').trim().replace(/\r\n/g, '\n'); // Remove primeira linha (geralmente nome)
                         return { success: true, lyrics: cleanedLyrics, message: 'Letra encontrada (lyrics.ovh).' };
                    }
                }
                
                // Se chegou aqui, nenhuma API funcionou
                if (response.status === 404) return { success: false, lyrics: null, message: 'Letra não encontrada em nenhuma das fontes.' };
                throw new Error(`Erro na API de letras: ${response.status} (lyrics.ovh)`);

            } catch (error) {
                console.error('Erro ao buscar letras:', error);
                return { success: false, lyrics: null, message: `Falha ao buscar letra: ${error.message}. As APIs podem estar offline ou instáveis.` }; 
            }
        }

        // =========================================================================
        // FUNÇÕES DE UI (EXIBIÇÃO)
        // =========================================================================

        function displayResults(artist, song, lyrics) {
            const resultsContent = document.getElementById('resultsContent');
            resultsContent.innerHTML = ''; 

            const language = detectLanguage(lyrics);
            const profanityAnalysis = analyzeProfanity(lyrics);
            const sentimentAnalysis = analyzeSentiment(lyrics, language);
            const keywords = extractKeywords(lyrics, 15);
            const chorus = findChorus(lyrics);
            const basicSummary = generateBasicSummary(language, keywords, sentimentAnalysis);

            const wordCount = lyrics.split(/\s+/).filter(Boolean).length;
            const lineCount = lyrics.split('\n').filter(Boolean).length;
            const charCount = lyrics.length;

            currentAnalysisData = { artist, song, language, lyrics, analysis: { profanity: profanityAnalysis, sentiment: sentimentAnalysis, keywords: keywords, chorus: chorus, summary: basicSummary, stats: { wordCount, lineCount, charCount } }, translation: null };

            let html = `
                <div class="song-info">
                    <h2>${escapeHtml(song)}</h2>
                    <p>Artista: <strong>${escapeHtml(artist)}</strong> 
                       <span class="language-badge">${language.toUpperCase()}</span>
                    </p>
                </div>
                <div class="analysis-grid">
                     <div class="analysis-card stats-card"><h3><i class="fas fa-chart-line"></i> Estatísticas</h3><div class="stats-row"><div class="stat-item"><div class="stat-value">${wordCount}</div><div class="stat-label">Palavras</div></div><div class="stat-item"><div class="stat-value">${lineCount}</div><div class="stat-label">Linhas</div></div><div class="stat-item"><div class="stat-value">${charCount}</div><div class="stat-label">Caracteres</div></div></div></div>
                     <div class="analysis-card ${profanityAnalysis.hasProfanity ? (profanityAnalysis.level === 'high' ? 'danger' : 'warning') : 'success'}"><h3><i class="fas fa-skull-crossbones"></i> Conteúdo Explícito</h3><p><strong>Status:</strong> ${profanityAnalysis.hasProfanity ? '⚠️ Contém' : '✅ Sem'} conteúdo explícito</p><p><strong>Nível:</strong> <span class="badge ${profanityAnalysis.level}">${profanityAnalysis.level === 'high' ? 'Alto' : profanityAnalysis.level === 'medium' ? 'Médio' : 'Baixo'} (${profanityAnalysis.count})</span></p>${profanityAnalysis.wordsMap.size > 0 ? `<p><strong>Palavras:</strong></p><div>${Array.from(profanityAnalysis.wordsMap.keys()).map(w => `<span class="badge ${profanityAnalysis.level}" title="Contagem: ${profanityAnalysis.wordsMap.get(w)}">${w}</span>`).join('')}</div>` : ''}</div>
                     <div class="analysis-card ${sentimentAnalysis.label === 'Positivo' ? 'success' : sentimentAnalysis.label === 'Negativo' ? 'danger' : 'neutral'}"><h3><i class="fas fa-heart"></i> Sentimento</h3><p><strong>Geral:</strong> <span class="badge ${sentimentAnalysis.label.toLowerCase()}">${sentimentAnalysis.label}</span></p><p><small>Positivas: ${sentimentAnalysis.positiveScore} | Negativas: ${sentimentAnalysis.negativeScore}</small></p><div class="sentiment-bar"><div class="sentiment-segment sentiment-positive" style="width: ${sentimentAnalysis.positivePercent}%" title="${sentimentAnalysis.positivePercent}% Positivo">${sentimentAnalysis.positivePercent > 10 ? sentimentAnalysis.positivePercent+'%' : ''}</div><div class="sentiment-segment sentiment-neutral" style="width: ${100 - sentimentAnalysis.positivePercent - sentimentAnalysis.negativePercent > 5 ? 100 - sentimentAnalysis.positivePercent - sentimentAnalysis.negativePercent + '%' : ''}; flex-grow: 1;" title="${100 - sentimentAnalysis.positivePercent - sentimentAnalysis.negativePercent}% Neutro"></div><div class="sentiment-segment sentiment-negative" style="width: ${sentimentAnalysis.negativePercent}%" title="${sentimentAnalysis.negativePercent}% Negativo">${sentimentAnalysis.negativePercent > 10 ? sentimentAnalysis.negativePercent+'%' : ''}</div></div></div>
                     <div class="analysis-card"><h3><i class="fas fa-tags"></i> Palavras-Chave</h3><div class="word-cloud">${keywords.length > 0 ? keywords.map(([word, count]) => `<div class="word-item" title="Contagem: ${count}">${word}<span class="word-count">${count}</span></div>`).join('') : '<p>Nenhuma palavra-chave encontrada.</p>'}</div></div>
                     <div class="analysis-card neutral"><h3><i class="fas fa-file-alt"></i> Resumo Básico</h3><p>${basicSummary}</p></div>
                     ${chorus ? `<div class="analysis-card warning"><h3><i class="fas fa-redo-alt"></i> Refrão Detectado</h3><div class="chorus-section"><h4><i class="fas fa-music"></i> Repetido ${chorus.repetitions} vezes (aprox.):</h4><div class="chorus-text">${escapeHtml(chorus.text)}</div></div></div>` : ''}
                </div>
                <div class="lyrics-section">
                    <h3><i class="fas fa-file-lines"></i> Letra da Música</h3>
                    <div class="tab-buttons">
                        <button class="tab-btn active" data-tab="original">Letra Original</button>
                        ${language === 'en' ? '<button class="tab-btn" data-tab="translated">Tradução (PT)</button>' : ''}
                    </div>
                    <div id="original-tab" class="tab-content"><div class="lyrics-original">${highlightProfanity(escapeHtml(lyrics), profanityAnalysis.wordsMap)}</div></div>
                    ${language === 'en' ? `<div id="translated-tab" class="tab-content" style="display: none;"><div class="translation-note"><i class="fas fa-info-circle"></i> Tradução via MyMemory API (gratuita). Pode falhar devido a limites.</div><div class="lyrics-translated" id="translatedLyrics"><div class="loading"><span class="spinner"></span>Aguardando clique na aba para traduzir...</div></div></div>` : ''}
                </div>`;

            resultsContent.innerHTML = html;
            document.getElementById('resultsSection').style.display = 'block';
            document.getElementById('noResults').style.display = 'none';

            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.tab-btn.active').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                    this.classList.add('active');
                    const targetTab = document.getElementById(this.dataset.tab + '-tab');
                    if (targetTab) targetTab.style.display = 'block';
                    if (this.dataset.tab === 'translated' && document.getElementById('translatedLyrics')?.querySelector('.loading')) {
                        translateLyrics(lyrics); 
                    }
                });
            });
            document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
        }

        async function translateLyrics(originalLyrics) {
            const translationContainer = document.getElementById('translatedLyrics');
            if (!translationContainer || !translationContainer.querySelector('.loading')) return; 
            translationContainer.innerHTML = `<div class="loading"><span class="spinner"></span>Traduzindo...</div>`;

            try {
                const result = await translateWithMyMemory(originalLyrics, 'en', 'pt');
                if (result.success) {
                    currentAnalysisData.translation = result.translatedText; 
                    const profanityAnalysisPT = analyzeProfanity(result.translatedText);
                    translationContainer.innerHTML = `<div class="lyrics-translated">${highlightProfanity(escapeHtml(result.translatedText), profanityAnalysisPT.wordsMap)}</div>`;
                     const profCard = resultsContent.querySelector('.analysis-card.danger, .analysis-card.warning, .analysis-card.success'); 
                    if(profCard && profanityAnalysisPT.hasProfanity && !profCard.innerHTML.includes('Na tradução')) { 
                         profCard.innerHTML += `<hr style="margin: 15px 0; border: none; border-top: 1px solid #eee;"> <p><strong><i class="fas fa-language"></i> Na tradução:</strong> ${profanityAnalysisPT.count} (${profanityAnalysisPT.level})</p>`;
                    }
                } else {
                    translationContainer.innerHTML = `<p class="translation-error"><i class="fas fa-exclamation-circle"></i> Falha na tradução: ${escapeHtml(result.message) || 'Erro desconhecido.'}</p>`;
                }
            } catch (error) {
                console.error("Erro na função translateLyrics:", error);
                translationContainer.innerHTML = `<p class="translation-error"><i class="fas fa-exclamation-triangle"></i> Erro inesperado durante a tradução: ${escapeHtml(error.message)}</p>`;
            }
        }
        
        function highlightProfanity(text, profanityMap) {
            if (!profanityMap || profanityMap.size === 0) return text;
            const wordsToHighlight = Array.from(profanityMap.keys());
            const escapedWords = wordsToHighlight.map(word => word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
            const regex = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'gi');
            return text.replace(regex, '<span class="highlight" title="Conteúdo explícito">$1</span>');
        }

        function setMessage(message, type = 'info', isLoading = false) {
            const container = document.getElementById('messageContainer');
            const icon = {
                'info': 'fas fa-info-circle',
                'success': 'fas fa-check-circle',
                'error': 'fas fa-times-circle'
            }[type];
            const iconHtml = isLoading ? '<span class="spinner"></span>' : `<i class="${icon}"></i>`;
            container.innerHTML = `<div class="message ${type}-message">${iconHtml} ${escapeHtml(message)}</div>`;
            if (!isLoading) {
                 setTimeout(() => clearMessage(), 7000); 
            }
        }

        function clearMessage() { document.getElementById('messageContainer').innerHTML = ''; }
        function escapeHtml(text) { if (text === null || text === undefined) return ''; const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }; return text.replace(/[&<>"']/g, m => map[m]); }

        // =========================================================================
        // FUNÇÕES DE DOWNLOAD
        // =========================================================================
         function showDownloadModal() {
            if (!currentAnalysisData) {
                setMessage('Nenhuma análise para baixar.', 'info');
                return;
            }
            document.getElementById('downloadModal').classList.add('show');
        }

        function generateAnalysisText() {
            if (!currentAnalysisData) return "Nenhuma análise disponível.";
            const { artist, song, language, lyrics, analysis, translation } = currentAnalysisData;
            const { profanity, sentiment, keywords, chorus, summary, stats } = analysis;

            let content = `ANÁLISE DA MÚSICA: ${song} por ${artist}\n`;
            content += `==================================================\n\n`;
            content += `Idioma Detectado: ${language.toUpperCase()}\n`;
            content += `Estatísticas: ${stats.wordCount} palavras, ${stats.lineCount} linhas, ${stats.charCount} caracteres\n\n`;
            content += `RESUMO BÁSICO:\n${summary.replace(/<br.*?>|\*+/g, '').replace(/<small>.*?<\/small>/g, '').trim()}\n\n`;
            content += `SENTIMENTO:\n- Geral: ${sentiment.label}\n- Palavras Positivas: ${sentiment.positiveScore}\n- Palavras Negativas: ${sentiment.negativeScore}\n\n`;
            content += `CONTEÚDO EXPLÍCITO:\n- Status: ${profanity.hasProfanity ? 'Contém' : 'Não contém'}\n- Nível: ${profanity.level} (${profanity.count})\n`;
            if (profanity.wordsMap.size > 0) content += `- Palavras: ${Array.from(profanity.wordsMap.keys()).join(', ')}\n`;
            content += `\n`;
            content += `PALAVRAS-CHAVE (Top ${keywords.length}):\n${keywords.map(([word, count]) => `- ${word} (${count})`).join('\n')}\n\n`;
            if (chorus) content += `REFRÃO DETECTADO (Repetido ${chorus.repetitions} vezes):\n${chorus.text}\n\n`;
            content += `LETRA ORIGINAL:\n------------------------\n${lyrics}\n------------------------\n\n`;
            if (translation) content += `TRADUÇÃO (PT):\n------------------------\n${translation}\n------------------------\n\n`;
            content += `Análise gerada em: ${new Date().toLocaleString('pt-BR')}\n`;
            return content;
        }

        function generateAnalysisMarkdown() {
             if (!currentAnalysisData) return "Nenhuma análise disponível.";
            const { artist, song, language, lyrics, analysis, translation } = currentAnalysisData;
            const { profanity, sentiment, keywords, chorus, summary, stats } = analysis;

             let content = `# Análise: ${song} - ${artist}\n\n`;
            content += `**Idioma:** ${language.toUpperCase()} | `;
            content += `**Estatísticas:** ${stats.wordCount} palavras, ${stats.lineCount} linhas, ${stats.charCount} caracteres\n\n`;
            content += `## Resumo Básico\n${summary.replace(/<br.*?>/g, '\n').replace(/<\/?small>/g, '')}\n\n`;
            content += `## Sentimento\n- **Geral:** ${sentiment.label}\n- Positivas: ${sentiment.positiveScore}, Negativas: ${sentiment.negativeScore}\n\n`;
            content += `## Conteúdo Explícito\n- **Status:** ${profanity.hasProfanity ? 'Contém' : 'Não contém'}\n- **Nível:** ${profanity.level} (${profanity.count})\n`;
            if (profanity.wordsMap.size > 0) content += `- **Palavras:** ${Array.from(profanity.wordsMap.keys()).map(w => `\`${w}\``).join(', ')}\n`;
            content += `\n`;
            content += `## Palavras-Chave (Top ${keywords.length})\n${keywords.map(([word, count]) => `- ${word} (${count})`).join('\n')}\n\n`;
            if (chorus) content += `## Refrão Detectado (Repetido ${chorus.repetitions} vezes)\n\`\`\`\n${chorus.text}\n\`\`\`\n\n`;
            content += `## Letra Original\n\`\`\`\n${lyrics}\n\`\`\`\n\n`;
            if (translation) content += `## Tradução (PT)\n\`\`\`\n${translation}\n\`\`\`\n\n`;
            content += `*Análise gerada em: ${new Date().toLocaleString('pt-BR')}*`;
            return content;
        }

        function createDownload(content, filename, mimeType) {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        function getDateString() { return new Date().toISOString().split('T')[0]; }

        // =========================================================================
        // EVENT LISTENERS E INICIALIZAÇÃO
        // =========================================================================

        document.getElementById('searchBtn').addEventListener('click', async function() {
            const artist = document.getElementById('artistInput').value.trim();
            const song = document.getElementById('songInput').value.trim();
            if (!artist || !song) { setMessage('Preencha artista e música.', 'error'); return; }

            clearMessage(); this.disabled = true; this.innerHTML = '<span class="spinner"></span>Analisando...';
            document.getElementById('resultsSection').style.display = 'none';
            document.getElementById('noResults').style.display = 'none';
            currentAnalysisData = null; 

            try {
                const lyricsResult = await searchLyrics(artist, song);
                if (lyricsResult.success && lyricsResult.lyrics) {
                    displayResults(artist, song, lyricsResult.lyrics);
                    setMessage(`Análise de "${song}" concluída!`, 'success');
                } else {
                    setMessage(lyricsResult.message || `Letra não encontrada.`, 'error');
                    document.getElementById('noResults').style.display = 'block';
                }
            } catch (error) {
                console.error("Erro no clique:", error);
                setMessage(`Erro inesperado: ${error.message}.`, 'error');
                document.getElementById('noResults').style.display = 'block';
            } finally {
                this.disabled = false; this.innerHTML = '<i class="fas fa-search"></i> Analisar'; 
            }
        });

        // Listeners Botões Download
        document.getElementById('downloadBtn').addEventListener('click', showDownloadModal);
        document.getElementById('downloadTxtBtn').addEventListener('click', () => { if(!currentAnalysisData) return; createDownload(generateAnalysisText(), `Analise-${currentAnalysisData.artist.replace(/\s/g, '_')}-${currentAnalysisData.song.replace(/\s/g, '_')}.txt`, 'text/plain;charset=utf-8'); document.getElementById('downloadModal').classList.remove('show'); });
        document.getElementById('downloadMdBtn').addEventListener('click', () => { if(!currentAnalysisData) return; createDownload(generateAnalysisMarkdown(), `Analise-${currentAnalysisData.artist.replace(/\s/g, '_')}-${currentAnalysisData.song.replace(/\s/g, '_')}.md`, 'text/markdown;charset=utf-8'); document.getElementById('downloadModal').classList.remove('show'); });
        document.getElementById('downloadJsonBtn').addEventListener('click', () => {
             if(!currentAnalysisData) return;
             const dataToSave = structuredClone(currentAnalysisData); 
             if(dataToSave.analysis.summary) { dataToSave.analysis.summary = dataToSave.analysis.summary.replace(/<br.*?>|\*+/g, '').replace(/<small>.*?<\/small>/g, '').trim(); }
             createDownload(JSON.stringify(dataToSave, null, 2), `Analise-${dataToSave.artist.replace(/\s/g, '_')}-${dataToSave.song.replace(/\s/g, '_')}.json`, 'application/json;charset=utf-8');
             document.getElementById('downloadModal').classList.remove('show');
        });
        document.getElementById('downloadModal').addEventListener('click', (e) => { 
            if (e.target.id === 'downloadModal') { // Fecha o modal clicando fora
                e.currentTarget.classList.remove('show'); 
            }
        }); 

        document.getElementById('songInput').addEventListener('keypress', function(e) { if (e.key === 'Enter') document.getElementById('searchBtn').click(); });
        document.getElementById('artistInput').addEventListener('keypress', function(e) { if (e.key === 'Enter') document.getElementById('searchBtn').click(); });

        document.getElementById('noResults').style.display = 'block';