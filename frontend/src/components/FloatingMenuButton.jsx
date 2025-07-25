import { Truck } from 'lucide-react';
import { Button } from './ui/button';

const FloatingMenuButton = ({ onClick }) => {
  return (
    <Button 
      onClick={onClick}
      className="fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
      size="icon"
    >
      <Truck className="h-6 w-6" />
    </Button>
  );
};

export default FloatingMenuButton;