# Músicas do player lo-fi

O site **não** inclui os arquivos de áudio: o Free Music Archive (FMA) exige
login para baixar. Enquanto os arquivos não estiverem nesta pasta, o player
mostra "Faixas ainda não adicionadas" e não toca nada (nenhum erro quebra o site).

## Passo a passo (as 4 faixas padrão, todas CC0)

1. Crie uma conta gratuita (ou entre) em https://freemusicarchive.org.
2. Abra cada página abaixo e clique em **Download**.
3. Renomeie o arquivo baixado **exatamente** como indicado e coloque nesta pasta
   (`public/assets/music/`):

| Faixa          | Página                                                                                                   | Nome do arquivo     |
| -------------- | -------------------------------------------------------------------------------------------------------- | ------------------- |
| Calm Currents  | https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/calm-currents-lofi-relax-calm/          | `calm-currents.mp3`  |
| Peaceful Drift | https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/peaceful-drift-lofi-nostalgic-calm/     | `peaceful-drift.mp3` |
| Tokyo Sunset   | https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/tokyo-sunset-lofi-peaceful-soft/        | `tokyo-sunset.mp3`   |
| Morning Coffee | https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/morning-coffee/                            | `morning-coffee.mp3` |

4. Recarregue o site e clique em "lo-fi". Não precisa mexer em código.

> Dica: se o arquivo vier muito pesado, recomprima para MP3 ~128 kbps
> (por exemplo com Audacity ou ffmpeg: `ffmpeg -i entrada.mp3 -b:a 128k saida.mp3`).
> Um MP3 de 3 minutos a 128 kbps tem cerca de 3 MB.

## Licença

Todas as faixas acima são de **HoliznaCC0**, publicadas sob
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (domínio público):
uso livre, inclusive comercial, sem obrigação de crédito. Mesmo assim o player
mostra o crédito e o link da fonte, por cortesia.

## Adicionar ou trocar faixas

1. Coloque o `.mp3` (~128 kbps) nesta pasta.
2. Edite `src/data/playlist.ts` e acrescente um item em `TRACKS`
   (título, artista, `src`, licença, link da licença e link da fonte).
3. Use apenas músicas **suas**, **CC0/domínio público** ou **CC BY** (neste caso
   o crédito ao autor é obrigatório: preencha `artist`, `license` e `sourceUrl`).
   Nada de músicas comerciais sem licença.
