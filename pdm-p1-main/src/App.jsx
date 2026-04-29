import React, { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import CapturarDados from './components/CapturarDados.jsx'
import ExibeDados from './components/ExibeDados.jsx'   

const App = () => {
  const [valorInicial, setValorInicial] = useState(0)
  const [valorAporte, setValorAporte] = useState(0)
  const [taxaJuros, setTaxaJuros] = useState(0)
  const [periodo, setPeriodo] = useState(0)
  
  const [resultados, setResultados] = useState(null)

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card">
            <div className="card-body text-center">
              <h1 className="h3 mb-0">Hello, Investimentos</h1>
              
              <CapturarDados
                valorInicial={valorInicial}
                setValorInicial={setValorInicial}
                valorAporte={valorAporte}
                setValorAporte={setValorAporte}
                taxaJuros={taxaJuros}
                setTaxaJuros={setTaxaJuros}
                periodo={periodo}
                setPeriodo={setPeriodo}
                calcular={calcular}                  
              />

                <ExibeDados
                  valorFinal={valorFinal}
                  numAportes={numAportes}
                  jurosAcumulados={jurosAcumulados}
                  rentabilidade={rentabilidade}
                />
              
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App