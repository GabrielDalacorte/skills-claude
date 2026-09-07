import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// Vídeo de pitch: nitidez importa mais que tamanho de arquivo.
Config.setCrf(16);

/*
 * Os prints são 4800×2700 e cada aba do render carrega vários, junto com as
 * cinco .woff2 do produto. Com muitas abas em paralelo o servidor do bundle
 * chega a segurar uma requisição de fonte por mais que os 28s padrão, e o
 * render morre inteiro em "delayRender was called but not cleared". Dois
 * minutos de prazo custa nada e tira essa flakiness do caminho.
 */
Config.setDelayRenderTimeoutInMilliseconds(120000);
