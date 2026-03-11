import { useEffect } from 'react';
import { Drawer } from 'expo-router/drawer';
import { useChatStore } from '../../store/chatStore';
import SidebarContent from '../../components/shared/SidebarContent';

export default function AppLayout() {
  const { loadChats, loadModels } = useChatStore();

  useEffect(() => {
    loadModels();
    loadChats();
  }, []);

  return (
    <Drawer
      drawerContent={(props) => <SidebarContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: '#111111', width: 300 },
        overlayColor: 'rgba(0,0,0,0.6)',
        swipeEdgeWidth: 60,
      }}
    >
      <Drawer.Screen name="chat" />
      <Drawer.Screen name="search" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="prompts" options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}
