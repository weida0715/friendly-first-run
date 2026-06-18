import { mockExperiments } from '../data/mock_experiments';
import { mockModels } from '../data/mock_models';
import { mockBlueprints } from '../data/mock_blueprints';
import { mockUsers } from '../data/mock_users';
import { mockIndicators, mockFeatures, mockIntervals, systemConfig } from '../data/mock_meta';

// Helper function to simulate API delay
const delay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms));

type ApiResponse<T> = { success?: boolean; error?: string } & T;

// Auth API
export function apiLogin(email: string, password: string) {
  return delay(500).then(() => {
    const identifier = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const identifierCandidates = new Set<string>([identifier]);
    if (identifier.endsWith('@bee.dev')) {
      identifierCandidates.add(identifier.replace('@bee.dev', '@loop.dev'));
    }

    const matchedUser = mockUsers.find((u) => {
      const emailLower = u.email.toLowerCase();
      const usernameLower = u.username.toLowerCase();
      return identifierCandidates.has(emailLower) || identifierCandidates.has(usernameLower);
    });

    const roleHint =
      identifier.includes('admin') ? 'admin' : identifier.includes('moderator') ? 'moderator' : 'user';
    const hintedUser = mockUsers.find((u) => u.role === roleHint);

    if (identifier.length > 0 && normalizedPassword.length > 0) {
      const user = matchedUser ?? hintedUser ?? mockUsers.find((u) => u.role === 'user') ?? mockUsers[0];
      return {
        success: true,
        user: user,
        token: 'mock-token-' + user.id
      } as ApiResponse<{ user: any; token: string }>;
    }
    return {
      success: false,
      error: 'Invalid credentials. Use a valid email/username and any non-empty password in mock mode.'
    } as ApiResponse<{ user: any; token: string }>;
  });
}

export function apiRegister(email: string, password: string, username: string, name: string) {
  return delay(500).then(() => {
    const existingUser = mockUsers.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return {
        success: false,
        error: 'Email or username already exists'
      } as ApiResponse<{ user: any; token: string }>;
    }
    const newUser = {
      id: (mockUsers.length + 1).toString(),
      username,
      email,
      name,
      role: 'user' as const,
      avatar: `https://i.pravatar.cc/150?img=${mockUsers.length + 1}`,
      bio: '',
      followers: 0,
      following: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockUsers.push(newUser);
    return {
      success: true,
      user: newUser,
      token: 'mock-token-' + newUser.id
    } as ApiResponse<{ user: any; token: string }>;
  });
}

// Users API
export function apiListUsers(userId: string) {
  return delay(300).then(() => {
    return {
      success: true,
      users: mockUsers
    } as ApiResponse<{ users: any[] }>;
  });
}

export function apiCreateUser(userId: string, payload: any) {
  return delay(500).then(() => {
    const newUser = {
      id: (mockUsers.length + 1).toString(),
      ...payload,
      role: payload.role as 'user' | 'admin' | 'moderator',
      avatar: `https://i.pravatar.cc/150?img=${mockUsers.length + 1}`,
      bio: '',
      followers: 0,
      following: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockUsers.push(newUser);
    return {
      success: true,
      user: newUser
    } as ApiResponse<{ user: any }>;
  });
}

export function apiUpdateUser(userId: string, targetId: string, payload: any) {
  return delay(500).then(() => {
    const index = mockUsers.findIndex(u => u.id === targetId);
    if (index !== -1) {
      mockUsers[index] = { ...mockUsers[index], ...payload };
      return {
        success: true,
        user: mockUsers[index]
      } as ApiResponse<{ user: any }>;
    }
    return {
      success: false,
      error: 'User not found'
    } as ApiResponse<{ user: any }>;
  });
}

export function apiResetPassword(userId: string, targetId: string, password: string) {
  return delay(300).then(() => {
    return {
      success: true
    } as ApiResponse<{ success: boolean }>;
  });
}

export function apiDeleteUser(userId: string, targetId: string) {
  return delay(300).then(() => {
    const index = mockUsers.findIndex(u => u.id === targetId);
    if (index !== -1) {
      mockUsers.splice(index, 1);
      return {
        success: true
      } as ApiResponse<{ success: boolean }>;
    }
    return {
      success: false,
      error: 'User not found'
    } as ApiResponse<{ success: boolean }>;
  });
}

export function apiListPublicUsers() {
  return delay(300).then(() => {
    return {
      success: true,
      users: mockUsers.filter(u => u.role === 'user')
    } as ApiResponse<{ users: any[] }>;
  });
}

// Experiments API
export function apiListExperiments(params: { userId?: string; ownerUserId?: string; visibility?: string } = {}) {
  return delay(400).then(() => {
    let experiments = [...mockExperiments];
    
    if (params.ownerUserId) {
      experiments = experiments.filter(e => e.owner === params.ownerUserId);
    }
    
    return {
      success: true,
      experiments
    } as ApiResponse<{ experiments: any[] }>;
  });
}

export function apiCreateExperiment(userId: string, payload: any) {
  return delay(1000).then(() => {
    const newExperiment = {
      id: (mockExperiments.length + 1).toString(),
      ...payload,
      status: 'queued',
      progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: 'alex',
      symbol: 'BTCUSDT',
      splits: payload.splits || { train: 70, validation: 15, test: 15 },
      metrics: {}
    };
    mockExperiments.push(newExperiment);
    return {
      success: true,
      experiment: newExperiment
    } as ApiResponse<{ experiment: any }>;
  });
}

export function apiGetExperiment(params: { userId?: string; experimentId: string }) {
  return delay(300).then(() => {
    const experiment = mockExperiments.find(e => e.id === params.experimentId);
    if (experiment) {
      const components = [
        ...mockIndicators,
        ...mockFeatures,
        ...mockIntervals
      ];
      return {
        success: true,
        experiment,
        components
      } as ApiResponse<{ experiment: any; components: any[] }>;
    }
    return {
      success: false,
      error: 'Experiment not found'
    } as ApiResponse<{ experiment: any; components: any[] }>;
  });
}

// Models API
export function apiListModels(params: { experimentId?: string } = {}) {
  return delay(300).then(() => {
    let models = [...mockModels];
    
    if (params.experimentId) {
      models = models.filter(m => m.experiment_id === params.experimentId);
    }
    
    return {
      success: true,
      models
    } as ApiResponse<{ models: any[] }>;
  });
}

// Blueprints API
export function apiListLoopBlueprints() {
  return delay(300).then(() => {
    return {
      success: true,
      blueprints: mockBlueprints.filter(s => s.status === 'published')
    } as ApiResponse<{ blueprints: any[] }>;
  });
}

export function apiListLoopMockBlueprints() {
  return delay(300).then(() => {
    return {
      success: true,
      blueprints: mockBlueprints.filter(s => s.status === 'published')
    } as ApiResponse<{ blueprints: any[] }>;
  });
}

export function apiListBlueprints() {
  return delay(300).then(() => {
    return {
      success: true,
      blueprints: mockBlueprints.filter(s => s.owner === 'alex')
    } as ApiResponse<{ blueprints: any[] }>;
  });
}

export function apiListPublicBlueprints() {
  return delay(300).then(() => {
    return {
      success: true,
      blueprints: mockBlueprints.filter(s => s.status === 'published' && s.owner !== 'alex')
    } as ApiResponse<{ blueprints: any[] }>;
  });
}

export function apiListPendingBlueprints(userId?: string) {
  return delay(300).then(() => {
    return {
      success: true,
      blueprints: mockBlueprints.filter(s => s.status === 'pending')
    } as ApiResponse<{ blueprints: any[] }>;
  });
}

export function apiCreateBlueprint(userId: string, payload: any) {
  return delay(1000).then(() => {
    const newBlueprint = {
      id: (mockBlueprints.length + 1).toString(),
      ...payload,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: 'alex',
      parameters: payload.parameters || {}
    };
    mockBlueprints.push(newBlueprint);
    return {
      success: true,
      blueprint: newBlueprint
    } as ApiResponse<{ blueprint: any }>;
  });
}

export function apiUpdateBlueprint(userId: string, blueprintId: string, payload: any) {
  return delay(500).then(() => {
    const index = mockBlueprints.findIndex(s => s.id === blueprintId);
    if (index !== -1) {
      mockBlueprints[index] = { ...mockBlueprints[index], ...payload };
      return {
        success: true,
        blueprint: mockBlueprints[index]
      } as ApiResponse<{ blueprint: any }>;
    }
    return {
      success: false,
      error: 'Blueprint not found'
    } as ApiResponse<{ blueprint: any }>;
  });
}

export function apiRequestBlueprintApproval(userId: string, blueprintId: string) {
  return delay(500).then(() => {
    const index = mockBlueprints.findIndex(s => s.id === blueprintId);
    if (index !== -1) {
      mockBlueprints[index] = { ...mockBlueprints[index], status: 'pending' };
      return {
        success: true,
        blueprint: mockBlueprints[index]
      } as ApiResponse<{ blueprint: any }>;
    }
    return {
      success: false,
      error: 'Blueprint not found'
    } as ApiResponse<{ blueprint: any }>;
  });
}

export function apiApproveBlueprint(userId: string, blueprintId: string) {
  return delay(500).then(() => {
    const index = mockBlueprints.findIndex(s => s.id === blueprintId);
    if (index !== -1) {
      mockBlueprints[index] = { ...mockBlueprints[index], status: 'published' };
      return {
        success: true,
        blueprint: mockBlueprints[index]
      } as ApiResponse<{ blueprint: any }>;
    }
    return {
      success: false,
      error: 'Blueprint not found'
    } as ApiResponse<{ blueprint: any }>;
  });
}

export function apiRejectBlueprint(userId: string, blueprintId: string) {
  return delay(500).then(() => {
    const index = mockBlueprints.findIndex(s => s.id === blueprintId);
    if (index !== -1) {
      mockBlueprints[index] = { ...mockBlueprints[index], status: 'rejected' };
      return {
        success: true,
        blueprint: mockBlueprints[index]
      } as ApiResponse<{ blueprint: any }>;
    }
    return {
      success: false,
      error: 'Blueprint not found'
    } as ApiResponse<{ blueprint: any }>;
  });
}

// Meta API
export function apiListMeta() {
  return delay(300).then(() => {
    return {
      success: true,
      indicators: mockIndicators,
      features: mockFeatures,
      blueprints: mockBlueprints.filter(s => s.status === 'published'),
      intervals: mockIntervals,
      pendingBlueprints: mockBlueprints.filter(s => s.status === 'pending'),
      systemConfig,
      jobQueue: {
        experiment: mockExperiments.filter(e => e.status === 'queued' || e.status === 'running')
      }
    };
  });
}

// Library API
export function apiListLibraryItems(params: { userId?: string } = {}) {
  return delay(300).then(() => {
    const items = [];
    
    if (params.userId) {
      // Return user's items
      items.push(...mockModels.filter(m => m.owner === 'alex'));
      items.push(...mockBlueprints.filter(s => s.owner === 'alex'));
    }
    
    return {
      success: true,
      items
    } as ApiResponse<{ items: any[] }>;
  });
}

// Model Logs API
export function apiListModelLogs(params: { modelId?: string } = {}) {
  return delay(300).then(() => {
    return {
      success: true,
      logs: []
    } as ApiResponse<{ logs: any[] }>;
  });
}

// Follow API
export function apiCreateFollow(payload: any) {
  return delay(300).then(() => {
    return {
      success: true,
      follow: payload
    } as ApiResponse<{ follow: any }>;
  });
}

export function apiRemoveFollow(payload: any) {
  return delay(300).then(() => {
    return {
      success: true
    } as ApiResponse<{ success: boolean }>;
  });
}