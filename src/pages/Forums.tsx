
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Plus, User } from "lucide-react";
import { useForums } from "@/hooks/useForums";
import { format } from "date-fns";

const Forums = () => {
  const { categories, posts, isLoading, createPost, createComment } = useForums();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [postForm, setPostForm] = useState({
    subject: '',
    content: '',
    category_id: ''
  });
  const [commentText, setCommentText] = useState('');

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.subject || !postForm.category_id) return;

    await createPost(postForm);
    setPostForm({ subject: '', content: '', category_id: '' });
    setShowCreatePost(false);
  };

  const handleCreateComment = async (postId: string) => {
    if (!commentText.trim()) return;

    await createComment({
      post_id: postId,
      comment_text: commentText
    });
    setCommentText('');
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Forums</h1>
        <Button onClick={() => setShowCreatePost(!showCreatePost)}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {showCreatePost && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={postForm.subject}
                  onChange={(e) => setPostForm({ ...postForm, subject: e.target.value })}
                  placeholder="Post subject"
                  required
                />
              </div>
              
              <div>
                <Label>Category</Label>
                <Select value={postForm.category_id} onValueChange={(value) => setPostForm({ ...postForm, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={postForm.content}
                  onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                  placeholder="Post content"
                  rows={6}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">Create Post</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreatePost(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="p-4">
              <h3 className="font-semibold">{category.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
              <Badge variant="secondary" className="mt-2">
                {posts.filter(p => p.category_id === category.id).length} posts
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Posts List */}
      <div className="space-y-6">
        {isLoading ? (
          <p className="text-muted-foreground">Loading posts...</p>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No posts yet. Be the first to start a discussion!</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{post.subject}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>by {(post as any).users?.full_name || (post as any).users?.email || 'Anonymous'}</span>
                        <span>•</span>
                        <span>{format(new Date(post.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {getCategoryName(post.category_id)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {post.content && (
                  <p className="text-muted-foreground mb-4">{post.content}</p>
                )}
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                </div>

                {selectedPost === post.id && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted">
                    <Label htmlFor="comment">Add a comment</Label>
                    <Textarea
                      id="comment"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write your comment..."
                      className="mt-2"
                      rows={3}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => handleCreateComment(post.id)}>
                        Post Comment
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedPost(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Forums;
