// src/components/ExibeDados.jsx

const ExibeDados = ({
  valorFinal,
  numAportes,
  jurosAcumulados,
  rentabilidade
}) => {
    const calcular = () => {
    if (valorInicial < 0 || valorAporte < 0 || taxaJuros < 0 || periodo <= 0) {
      alert('Valores inválidos!')
      return
    }

    const taxaMensal = taxaJuros / 100 / 12          
    const n = periodo                                

    
    let valorFinal = valorInicial * Math.pow(1 + taxaMensal, n)
    if (taxaMensal > 0) {
      valorFinal += valorAporte * ((Math.pow(1 + taxaMensal, n) - 1) / taxaMensal)
    } else {
      valorFinal += valorAporte * n
    }

    const totalAportado = valorInicial + valorAporte * n
    const jurosAcumulados = valorFinal - totalAportado
    const rentabilidade = totalAportado > 0 
      ? ((valorFinal / totalAportado) - 1) * 100 
      : 0

    
    setResultados({
      valorFinal: valorFinal.toFixed(2),
      numAportes: n,
      jurosAcumulados: jurosAcumulados.toFixed(2),
      rentabilidade: rentabilidade.toFixed(2)
    })
  }
  
  return (
    <div className="mt-4">
      <h4 className="text-center mb-3 text-success">Resultados da Simulação</h4>
      
      <div className="row g-3">
        
        <div className="col-12 col-md-6">
          <div className="card border-success h-100 text-center">
            <div className="card-body">
              <p className="text-muted mb-1 small">Valor final acumulado</p>
              <h4 className="text-success mb-0">
                R$ {Number(valorFinal).toLocaleString('pt-BR')}
              </h4>
            </div>
          </div>
        </div>

        
        <div className="col-12 col-md-6">
          <div className="card h-100 text-center">
            <div className="card-body">
              <p className="text-muted mb-1 small">Número de aportes</p>
              <h4 className="mb-0">{numAportes}</h4>
            </div>
          </div>
        </div>

        
        <div className="col-12 col-md-6">
          <div className="card border-primary h-100 text-center">
            <div className="card-body">
              <p className="text-muted mb-1 small">Juros acumulados</p>
              <h4 className="text-primary mb-0">
                R$ {Number(jurosAcumulados).toLocaleString('pt-BR')}
              </h4>
            </div>
          </div>
        </div>

        
        <div className="col-12 col-md-6">
          <div className="card border-info h-100 text-center">
            <div className="card-body">
              <p className="text-muted mb-1 small">Rentabilidade</p>
              <h4 className="text-info mb-0">{rentabilidade}%</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExibeDados