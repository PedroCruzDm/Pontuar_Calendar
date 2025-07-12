import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  addDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyDaO2ENxmhrr1UamtoZgI3ujePMSaLT1qo",
  authDomain: "calendario-2cb0b.firebaseapp.com",
  databaseURL: "https://calendario-2cb0b-default-rtdb.firebaseio.com",
  projectId: "calendario-2cb0b",
  storageBucket: "calendario-2cb0b.firebasestorage.app",
  messagingSenderId: "660806699008",
  appId: "1:660806699008:web:bee36665775df88cde30e5",
  measurementId: "G-5PSCNRTERZ"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const auth = getAuth(app);

// Referências das coleções
export const eventosRef = collection(db, "eventos");
export const usuariosRef = collection(db, "usuarios");
export const calendariosRef = collection(db, "calendarios");

// Funções para gerenciar usuários
export const criarUsuario = async (userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const user = userCredential.user;
    
    // Criar documento do usuário na coleção 'usuarios'
    await setDoc(doc(db, "usuarios", user.uid), {
      uid: user.uid,
      nome: userData.nome,
      email: userData.email,
      instituicao: userData.instituicao,
      tipo: userData.tipo || 'admin',
      dataCriacao: new Date(),
      calendarioPublico: userData.calendarioPublico || false,
      linkCalendario: userData.linkCalendario || generateCalendarLink()
    });
    
    // Criar coleção de eventos para o usuário
    await setDoc(doc(db, "calendarios", user.uid), {
      uid: user.uid,
      nome: userData.nome,
      instituicao: userData.instituicao,
      publico: userData.calendarioPublico || false,
      linkCalendario: userData.linkCalendario || generateCalendarLink(),
      dataCriacao: new Date()
    });
    
    return user;
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    throw error;
  }
};

export const logarUsuario = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    throw error;
  }
};

export const deslogarUsuario = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    throw error;
  }
};

// Função para atualizar dados do usuário
export const atualizarUsuario = async (userId, dadosAtualizados) => {
  try {
    const user = auth.currentUser;
    if (!user || user.uid !== userId) {
      throw new Error("Usuário não autenticado ou ID inválido");
    }

    // Atualizar dados no Firestore
    await updateDoc(doc(db, "usuarios", userId), {
      ...dadosAtualizados,
      dataAtualizacao: new Date()
    });

    // Atualizar dados no calendário também
    await updateDoc(doc(db, "calendarios", userId), {
      nome: dadosAtualizados.nome || user.displayName,
      instituicao: dadosAtualizados.instituicao,
      dataAtualizacao: new Date()
    });

    // Atualizar displayName no Auth se fornecido
    if (dadosAtualizados.nome) {
      await updateProfile(user, {
        displayName: dadosAtualizados.nome
      });
    }

    return true;
  } catch (error) {
    console.error("Erro ao atualizar dados do usuário:", error);
    throw error;
  }
};

// Função para atualizar senha do usuário
export const atualizarSenha = async (novaSenha) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    await updatePassword(user, novaSenha);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    throw error;
  }
};

// Função para reautenticar usuário (necessária para algumas operações sensíveis)
export const reautenticarUsuario = async (email, senha) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    const credential = EmailAuthProvider.credential(email, senha);
    await reauthenticateWithCredential(user, credential);
    return true;
  } catch (error) {
    console.error("Erro ao reautenticar usuário:", error);
    throw error;
  }
};

// Função para deletar conta do usuário
export const deletarConta = async (email, senha) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    const userId = user.uid;

    // Primeiro, reautenticar o usuário
    await reautenticarUsuario(email, senha);

    // Deletar todos os dados do usuário no Firestore
    await Promise.all([
      // Deletar eventos do usuário
      deleteUserEvents(userId),
      // Deletar dados do usuário
      deleteDoc(doc(db, "usuarios", userId)),
      // Deletar calendário do usuário
      deleteDoc(doc(db, "calendarios", userId)),
      // Deletar configurações de header
      deleteDoc(doc(db, "headerConfigs", userId)).catch(() => {}), // Ignore se não existir
      // Deletar tipos de eventos personalizados
      deleteDoc(doc(db, "tiposEventos", userId)).catch(() => {}) // Ignore se não existir
    ]);

    // Por último, deletar a conta do usuário no Auth
    await deleteUser(user);

    return true;
  } catch (error) {
    console.error("Erro ao deletar conta:", error);
    throw error;
  }
};

// Função auxiliar para deletar todos os eventos do usuário
const deleteUserEvents = async (userId) => {
  try {
    const q = query(eventosRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Erro ao deletar eventos do usuário:", error);
    throw error;
  }
};

export const atualizarVisibilidade = async (uid, publico) => {
  try {
    await updateDoc(doc(db, "usuarios", uid), {
      calendarioPublico: publico
    });
    await updateDoc(doc(db, "calendarios", uid), {
      publico: publico
    });
  } catch (error) {
    console.error("Erro ao atualizar visibilidade:", error);
    throw error;
  }
};

export const obterDadosUsuario = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "usuarios", uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Erro ao obter dados do usuário:", error);
    throw error;
  }
};

export const obterCalendarioPublico = async (linkCalendario) => {
  try {
    // Buscar o calendário pelo link
    const q = query(usuariosRef, where("linkCalendario", "==", linkCalendario), where("calendarioPublico", "==", true));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      const uid = userData.uid;
      
      // Buscar eventos do usuário
      const eventosQuery = query(eventosRef, where("userId", "==", uid));
      const eventosSnapshot = await getDocs(eventosQuery);
      
      const eventos = eventosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        start: doc.data().start?.toDate ? doc.data().start.toDate() : new Date(doc.data().start),
        end: doc.data().end?.toDate ? doc.data().end.toDate() : new Date(doc.data().end)
      }));
      
      return {
        calendario: {
          nome: userData.nome,
          instituicao: userData.instituicao,
          linkCalendario: userData.linkCalendario,
          publico: userData.calendarioPublico
        },
        eventos: eventos
      };
    }
    return null;
  } catch (error) {
    console.error("Erro ao obter calendário público:", error);
    throw error;
  }
};

// Função para obter dados do usuário
export const obterUsuario = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "usuarios", userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Erro ao obter dados do usuário:", error);
    throw error;
  }
};

// Função para criar evento com userId
export const criarEvento = async (eventoData, userId) => {
  try {
    const docRef = await addDoc(eventosRef, {
      ...eventoData,
      userId: userId,
      dataCriacao: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    throw error;
  }
};

// Função para buscar eventos do usuário logado
export const obterEventosUsuario = async (userId) => {
  try {
    const q = query(eventosRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      start: doc.data().start?.toDate ? doc.data().start.toDate() : new Date(doc.data().start),
      end: doc.data().end?.toDate ? doc.data().end.toDate() : new Date(doc.data().end)
    }));
  } catch (error) {
    console.error("Erro ao buscar eventos do usuário:", error);
    throw error;
  }
};

// Função para gerar link único do calendário
const generateCalendarLink = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Funções para gerenciar configurações de cabeçalho customizável
export const salvarConfiguracaoHeader = async (userId, configuracao) => {
  try {
    await setDoc(doc(db, "headerConfigs", userId), {
      ...configuracao,
      userId: userId,
      dataAtualizacao: new Date()
    });
    return true;
  } catch (error) {
    console.error("Erro ao salvar configuração do header:", error);
    throw error;
  }
};

export const obterConfiguracaoHeader = async (userId) => {
  try {
    const headerDoc = await getDoc(doc(db, "headerConfigs", userId));
    if (headerDoc.exists()) {
      return headerDoc.data();
    }
    // Retorna null se não existir configuração - não retorna padrão
    return null;
  } catch (error) {
    console.error("Erro ao obter configuração do header:", error);
    throw error;
  }
};

// Função para obter configuração de header por link público
export const obterConfiguracaoHeaderPublico = async (linkCalendario) => {
  try {
    // Primeiro, encontra o usuário pelo link do calendário
    const usuariosSnapshot = await getDocs(query(usuariosRef, where("linkCalendario", "==", linkCalendario)));
    
    if (!usuariosSnapshot.empty) {
      const userData = usuariosSnapshot.docs[0].data();
      return await obterConfiguracaoHeader(userData.uid);
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao obter configuração de header público:", error);
    throw error;
  }
};

// Funções para gerenciar tipos de eventos personalizados
export const salvarTiposEventos = async (userId, tipos) => {
  try {
    await setDoc(doc(db, "tiposEventos", userId), {
      tipos: tipos,
      userId: userId,
      dataAtualizacao: new Date()
    });
    return true;
  } catch (error) {
    console.error("Erro ao salvar tipos de eventos:", error);
    throw error;
  }
};

export const obterTiposEventos = async (userId) => {
  try {
    const tiposDoc = await getDoc(doc(db, "tiposEventos", userId));
    if (tiposDoc.exists()) {
      return tiposDoc.data().tipos || [];
    }
    // Retorna tipos padrão expandidos se não existir configuração
    return [
      { 
        id: 'reuniao', 
        nome: 'Reunião', 
        cor: '#2196F3', 
        icone: '🤝', 
        descricao: 'Reuniões de trabalho, meetings e encontros',
        categoria: 'corporativo',
        prioridade: 'media',
        publico: true,
        configuracoes: {
          duracaoPadrao: 60,
          lembrete: true,
          tempoLembrete: 15
        }
      },
      { 
        id: 'evento', 
        nome: 'Evento', 
        cor: '#4CAF50', 
        icone: '🎉', 
        descricao: 'Eventos especiais, celebrações e festividades',
        categoria: 'lazer',
        prioridade: 'alta',
        publico: true,
        configuracoes: {
          duracaoPadrao: 120,
          lembrete: true,
          tempoLembrete: 30
        }
      },
      { 
        id: 'deadline', 
        nome: 'Prazo', 
        cor: '#FF5722', 
        icone: '⏰', 
        descricao: 'Prazos importantes, entregas e vencimentos',
        categoria: 'corporativo',
        prioridade: 'alta',
        publico: true,
        configuracoes: {
          duracaoPadrao: 30,
          lembrete: true,
          tempoLembrete: 60
        }
      },
      { 
        id: 'feriado', 
        nome: 'Feriado', 
        cor: '#9C27B0', 
        icone: '🏖️', 
        descricao: 'Feriados nacionais, estaduais e municipais',
        categoria: 'pessoal',
        prioridade: 'baixa',
        publico: true,
        configuracoes: {
          duracaoPadrao: 1440,
          lembrete: false,
          tempoLembrete: 0
        }
      },
      { 
        id: 'aula', 
        nome: 'Aula', 
        cor: '#FF9800', 
        icone: '📚', 
        descricao: 'Aulas, cursos e atividades educacionais',
        categoria: 'educacional',
        prioridade: 'alta',
        publico: true,
        configuracoes: {
          duracaoPadrao: 90,
          lembrete: true,
          tempoLembrete: 15
        }
      },
      { 
        id: 'consulta', 
        nome: 'Consulta', 
        cor: '#E91E63', 
        icone: '🏥', 
        descricao: 'Consultas médicas, exames e procedimentos',
        categoria: 'saude',
        prioridade: 'alta',
        publico: false,
        configuracoes: {
          duracaoPadrao: 60,
          lembrete: true,
          tempoLembrete: 120
        }
      },
      { 
        id: 'viagem', 
        nome: 'Viagem', 
        cor: '#00BCD4', 
        icone: '✈️', 
        descricao: 'Viagens, férias e deslocamentos',
        categoria: 'pessoal',
        prioridade: 'media',
        publico: true,
        configuracoes: {
          duracaoPadrao: 1440,
          lembrete: true,
          tempoLembrete: 1440
        }
      },
      { 
        id: 'tarefa', 
        nome: 'Tarefa', 
        cor: '#795548', 
        icone: '📝', 
        descricao: 'Tarefas pessoais, afazeres e lembretes',
        categoria: 'pessoal',
        prioridade: 'media',
        publico: false,
        configuracoes: {
          duracaoPadrao: 30,
          lembrete: true,
          tempoLembrete: 30
        }
      },
      { 
        id: 'exercicio', 
        nome: 'Exercício', 
        cor: '#607D8B', 
        icone: '🏃', 
        descricao: 'Atividades físicas, esportes e exercícios',
        categoria: 'saude',
        prioridade: 'media',
        publico: true,
        configuracoes: {
          duracaoPadrao: 60,
          lembrete: true,
          tempoLembrete: 30
        }
      },
      { 
        id: 'aniversario', 
        nome: 'Aniversário', 
        cor: '#E91E63', 
        icone: '🎂', 
        descricao: 'Aniversários, datas comemorativas pessoais',
        categoria: 'lazer',
        prioridade: 'media',
        publico: true,
        configuracoes: {
          duracaoPadrao: 1440,
          lembrete: true,
          tempoLembrete: 1440
        }
      },
      { 
        id: 'projeto', 
        nome: 'Projeto', 
        cor: '#3F51B5', 
        icone: '📊', 
        descricao: 'Projetos, desenvolvimento e planejamento',
        categoria: 'corporativo',
        prioridade: 'alta',
        publico: true,
        configuracoes: {
          duracaoPadrao: 180,
          lembrete: true,
          tempoLembrete: 60
        }
      },
      { 
        id: 'manutencao', 
        nome: 'Manutenção', 
        cor: '#FF5722', 
        icone: '🔧', 
        descricao: 'Manutenções, reparos e serviços técnicos',
        categoria: 'corporativo',
        prioridade: 'alta',
        publico: true,
        configuracoes: {
          duracaoPadrao: 120,
          lembrete: true,
          tempoLembrete: 60
        }
      }
    ];
  } catch (error) {
    console.error("Erro ao obter tipos de eventos:", error);
    throw error;
  }
};

export const obterTiposEventosPublico = async (linkCalendario) => {
  try {
    // Primeiro, encontra o usuário pelo link do calendário
    const usuariosSnapshot = await getDocs(query(usuariosRef, where("linkCalendario", "==", linkCalendario)));
    
    if (!usuariosSnapshot.empty) {
      const userData = usuariosSnapshot.docs[0].data();
      return await obterTiposEventos(userData.uid);
    }
    
    return [];
  } catch (error) {
    console.error("Erro ao obter tipos de eventos público:", error);
    throw error;
  }
};

// Funções para gerenciar categoria preferida
export const salvarCategoriaPreferida = async (userId, categoria) => {
  try {
    await setDoc(doc(db, "categoriasPreferidas", userId), {
      categoria,
      dataAtualizacao: new Date().toISOString()
    });
  } catch (error) {
    console.error("Erro ao salvar categoria preferida:", error);
    throw error;
  }
};

export const obterCategoriaPreferida = async (userId) => {
  try {
    const categoriaDoc = await getDoc(doc(db, "categoriasPreferidas", userId));
    if (categoriaDoc.exists()) {
      return categoriaDoc.data().categoria || 'todas';
    }
    return 'todas';
  } catch (error) {
    console.error("Erro ao obter categoria preferida:", error);
    return 'todas';
  }
};

export default firebaseConfig;