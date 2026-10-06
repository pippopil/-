import { Router, Request, Response } from 'express';
import { CommunityPostItem } from '../types/api.js';

export const communityRouter = Router();

// Посты сообщества в памяти
const communityPosts: CommunityPostItem[] = [];

communityRouter.get('/posts', (_req: Request, res: Response) => {
  res.json({ success: true, posts: communityPosts });
});

communityRouter.post('/posts', (req: Request<{}, {}, Partial<CommunityPostItem>>, res: Response) => {
  const newPost: CommunityPostItem = {
    id: `post_${Date.now()}`,
    createdAt: new Date().toISOString(),
    likesCount: 0,
    comments: [],
    ...req.body
  };
  communityPosts.unshift(newPost);
  res.json({ success: true, post: newPost });
});
