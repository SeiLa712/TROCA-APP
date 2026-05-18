document.addEventListener('DOMContentLoaded', () => {

    const inputFoto = document.getElementById('foto')
    const previewBox = document.getElementById('preview-box')
    const previewImg = document.getElementById('preview-img')

    if(inputFoto && previewBox && previewImg){
        if(!previewImg.getAttribute('src') || previewImg.getAttribute('src') === '..' || previewImg.getAttribute('src') === ""){
            previewImg.src = '/img/sem-foto.png'
            previewBox.style.display = 'block'
        }

        inputFoto.addEventListener('change', function(evento) {
            const arquivo = evento.target.files[0]

            if(arquivo){
                const leitorDeArquivo = new FileReader()

                leitorDeArquivo.onload = function(e){
                    previewImg.src = e.target.result
                    previewBox.style.display = 'block'
                }

                leitorDeArquivo.readAsDataURL(arquivo)
            }
            else{
                previewImg.src = '/img/sem-foto.png'
                previewBox.style.display = 'block'
            }
        })
    }
})