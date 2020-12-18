const fs = require('fs');
const path = require('path');
const pdf2pic = require('pdf2pic');
const imgToPDF = require('image-to-pdf');
const Jimp = require('jimp');

// CONFIGURAÇÕES - INÍCIO
const NOME_ENTRADA = './input/doc_para_assinar.pdf';
const NOME_SAIDA = 'doc_assinado';
const ASSINATURA = './assinatura.png';
const TEMP_DIR = './temp';
const OUTPUT_DIR = './output';

const POSICAO_ASSINATURA = [450, 1485];

const options = {
  density: 150,
  saveFilename: NOME_SAIDA,
  savePath: TEMP_DIR,
  format: "png",
  width: 1240,
  height: 1754
};
// CONFIGURAÇÕES - FIM

const apagaDir = (dir) => {
  return new Promise((resolve, reject) => {
    console.log(`Removendo diretório ${dir} ...`);
    fs.rmdir(dir, { recursive: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`Diretório ${dir} removido.`);
        resolve();
      }
    });
  });
};

const criaDir = (dir) => {
  console.log(`Criando o diretório ${dir} ...`);
  return new Promise((resolve, reject) => {
    fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`Diretório ${dir} criado.`);
        resolve();
      }
    });
  });
};

const convertePDFEmImagens = () => {
  console.log('Convertendo PDF em imagens ...');
  return new Promise((resolve, reject) => {
    const storeAsImage = pdf2pic.fromPath(NOME_ENTRADA, options);
    storeAsImage.bulk(-1).then(() => {
      console.log('PDF convertido em imagens com sucesso !');
      resolve();
    });
  });
};

const carregaImagensSalvas = () => {
  console.log('Carregando imagens salvas ...')
  return new Promise((resolve, reject) => {
    fs.readdir(TEMP_DIR, (err, arquivos) => {
      if (err) {
        reject(err);
      } else {
        arquivos = arquivos.map(a => path.join(__dirname , TEMP_DIR, a));
        resolve(arquivos);
      }
    });
  });
};

const assinaImagens = (arquivos) => {
  console.log('Adicionando assinaturas ...');
  let qtdArquivosParaAssinar = arquivos.length;

  return new Promise((resolve, reject) => {
    arquivos.forEach(a => {
      Jimp.read(a).then(tpl => {
        Jimp.read(ASSINATURA).then(assinatura => {
          tpl.composite(assinatura, POSICAO_ASSINATURA[0], POSICAO_ASSINATURA[1], [Jimp.BLEND_DESTINATION_OVER], (err, tpl_assinado) => {
            tpl_assinado.write(a, (err, tpl_assinado) => {
              qtdArquivosParaAssinar--;
              if (qtdArquivosParaAssinar === 0) { // terminou
                console.log('Imagens assinadas com sucesso !');
                resolve(arquivos);
              }
            }); // fim - grava o arquivo da imagem assinado
          }); // fim - combina o arquivo com a assinatura      
        }); // fim - lê o arquivo da assinatura
      }); // fim - lê o arquivo da imagem
    }); // fim - para cada imagem
  });
};

const geraPDF = (arquivos) => {
  console.log('Gerando PDF final ...');
  return new Promise((resolve, reject) => {
    imgToPDF(arquivos, 'A4').pipe(fs.createWriteStream(path.join(__dirname , OUTPUT_DIR, NOME_SAIDA + '.pdf')));
    console.log('PDF gerado com sucesso !');            
    resolve();
  });
};

const main = () => {
  apagaDir(TEMP_DIR).then(() => criaDir(TEMP_DIR))
  .then(apagaDir(OUTPUT_DIR)).then(() => criaDir(OUTPUT_DIR))
  .then(() => convertePDFEmImagens())
  .then(() => carregaImagensSalvas())
  .then(arquivos => assinaImagens(arquivos))
  .then(arquivos => geraPDF(arquivos));
};

main();