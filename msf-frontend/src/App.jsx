import { useSelector } from 'react-redux';
import AppRouter from './routes';
import Notification from "./components/Notification";
import LoadingPage from './components/LoadingPage';

const App = () => {
  const isLoading = useSelector((state) => state.loading.isLoading); 

  return (
    <>
      <Notification />
      {isLoading && <LoadingPage />}
      <AppRouter />
    </>
  );
};

export default App;
