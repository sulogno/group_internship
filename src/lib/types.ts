export interface Profile {
  id: string
  email: string
  full_name: string
  roll_number: string
  branch: string
  specialization: string | null
  skills: string[]
  preferred_cluster_id: number | null
  current_cluster_id: number | null
  current_group_id: string | null
  role: 'student' | 'leader' | 'admin'
  profile_completed: boolean
  created_at: string
  updated_at: string
}

export interface Cluster {
  id: number
  name: string
  description: string
  created_at: string
}

export interface Group {
  id: string
  name: string
  description: string | null
  cluster_id: number
  leader_id: string
  max_members: number
  required_skills: string[]
  status: 'open' | 'almost_full' | 'full' | 'frozen'
  is_frozen: boolean
  activity_score: number
  created_at: string
  updated_at: string
  cluster?: Cluster
  leader?: Profile
  members?: GroupMember[]
  member_count?: number
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  joined_at: string
  profile?: Profile
}

export interface GroupApplication {
  id: string
  group_id: string
  applicant_id: string
  message: string
  skills_offered: string[]
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  reviewed_at: string | null
  applicant?: Profile
  group?: Group
}

export interface Message {
  id: string
  group_id: string
  sender_id: string
  content: string
  is_pinned: boolean
  is_announcement: boolean
  message_type: 'text' | 'system' | 'resource'
  created_at: string
  sender?: Profile
}

export interface Badge {
  id: number
  name: string
  description: string
  icon: string
  criteria: Record<string, unknown> | null
}

export interface GroupBadge {
  id: string
  group_id: string
  badge_id: number
  awarded_at: string
  badge?: Badge
}

export interface SystemSettings {
  id: number
  deadline: string | null
  is_system_frozen: boolean
  updated_at: string
}

export interface AdminLog {
  id: string
  admin_id: string
  action: string
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  admin?: Profile
}

export const SKILLS = [
  'Python',
  'Java',
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'Django',
  'Flask',
  'Spring Boot',
  'Machine Learning',
  'Deep Learning',
  'NLP',
  'Computer Vision',
  'TensorFlow',
  'PyTorch',
  'AWS',
  'Azure',
  'GCP',
  'Docker',
  'Kubernetes',
  'Terraform',
  'SQL',
  'MongoDB',
  'PostgreSQL',
  'Redis',
  'Cybersecurity',
  'Network Security',
  'Penetration Testing',
  'OWASP',
  'Git',
  'CI/CD',
  'REST APIs',
  'GraphQL',
  'LLMs',
  'Prompt Engineering',
  'RAG',
  'LangChain',
  'Hugging Face'
] as const

export const BRANCHES = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Data Science',
  'Artificial Intelligence',
  'Cybersecurity'
] as const
