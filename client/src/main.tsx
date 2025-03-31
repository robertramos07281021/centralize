import './index.css'
import ReactDOM from "react-dom/client";
import { ApolloProvider } from "@apollo/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import client from "./apollo/client";
import { store, persistor } from "./redux/store";
import App from "./App";

ReactDOM.createRoot(document.getElementById('root')!).render(
<Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </PersistGate>
  </Provider>
)
