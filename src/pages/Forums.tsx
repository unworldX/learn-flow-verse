import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, ThumbsDown, Users, Plus } from "lucide-react";
import { useForums } from "@/hooks/useForums";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Forums = () => {
  const { 
    categories, 
    posts, 
    isLoading, 
    createPost, 
    createComment, 
    refetch 
  } = useForums();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newPost, setNewPost] = useState({ subject: '', content: '', category_id: '' });
  const [newComment, setNewComment] = useState({ post_id: '', content: '' });
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [comments, setComments] = useState<any[]>([]);

  const handleCreatePost = async () => {
    if (!newPost.subject.trim() || !newPost.category_id) return;
    
    await createPost({
      subject: newPost.subject,
      content: newPost.content,
      category_id: newPost.category_id
    });
    setNewPost({ subject: '', content: '', category_id: '' });
    setShowCreatePost(false);
    refetch();
  };

  const handleCreateComment = async (postId: string, content: string) => {
    if (!content.trim()) return;
    await createComment({
      post_id: postId,
      comment_text: content
    });
    refetch();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Discussion Forums</h1>
        <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select 
                  value={newPost.category_id} 
                  onValueChange={(value) => setNewPost({...newPost, category_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
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
              <Input
                placeholder="Post title"
                value={newPost.subject}
                onChange={(e) => setNewPost({...newPost, subject: e.target.value})}
              />
              <Textarea
                placeholder="What's on your mind?"
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                rows={6}
              />
              <Button onClick={handleCreatePost} className="w-full">
                Create Post
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant={!selectedCategory ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedCategory('');
                  }}
                >
                  All Posts
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedCategory(category.id);
                      refetch();
                    }}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{post.subject}</CardTitle>
                      <Badge variant="outline">
                        {categories.find(c => c.id === post.category_id)?.name || 'General'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Posted {new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{post.content}</p>
                    
                    {/* Comments Section */}
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {comments.filter(c => c.post_id === post.id).length} Comments
                        </span>
                      </div>
                      
                      {/* Existing Comments */}
                      <div className="space-y-2 mb-4">
                        {comments
                          .filter(comment => comment.post_id === post.id)
                          .slice(0, 3)
                          .map((comment) => (
                            <div key={comment.id} className="p-3 bg-muted rounded-lg">
                              <p className="text-sm">{comment.comment_text}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          ))
                        }
                      </div>

                      {/* Add Comment */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a comment..."
                          value={newComment.post_id === post.id ? newComment.content : ''}
                          onChange={(e) => setNewComment({ post_id: post.id, content: e.target.value })}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleCreateComment(post.id, newComment.content);
                              setNewComment({ post_id: '', content: '' });
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            handleCreateComment(post.id, newComment.content);
                            setNewComment({ post_id: '', content: '' });
                          }}
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {posts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">
                {selectedCategory 
                  ? 'No posts in this category yet' 
                  : 'Be the first to start a discussion!'
                }
              </p>
              <Button onClick={() => setShowCreatePost(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Post
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Forums;
