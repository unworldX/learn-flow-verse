
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, MessageSquare, Plus, User, Calendar, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface ForumPost {
  id: string;
  subject: string;
  content: string;
  created_at: string;
  user_id: string;
  category_id: string;
  users?: { full_name: string; email: string };
  forum_categories?: { name: string };
}

interface ForumComment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  post_id: string;
  users?: { full_name: string; email: string };
}

const Forums = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    subject: "",
    content: "",
    category_id: ""
  });
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, []);

  useEffect(() => {
    if (selectedPost) {
      fetchComments(selectedPost.id);
    }
  }, [selectedPost]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('forum_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
  };

  const fetchPosts = async () => {
    let query = supabase
      .from('forum_posts')
      .select(`
        *,
        users!forum_posts_user_id_fkey(full_name, email),
        forum_categories(name)
      `)
      .order('created_at', { ascending: false });

    if (selectedCategory !== "all") {
      query = query.eq('category_id', selectedCategory);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      setPosts(data || []);
    }
  };

  const fetchComments = async (postId: string) => {
    const { data, error } = await supabase
      .from('forum_comments')
      .select(`
        *,
        users!forum_comments_user_id_fkey(full_name, email)
      `)
      .eq('post_id', postId)
      .order('created_at');

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data || []);
    }
  };

  const createPost = async () => {
    if (!user || !newPost.subject || !newPost.category_id) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('forum_posts')
      .insert({
        subject: newPost.subject,
        content: newPost.content,
        category_id: newPost.category_id,
        user_id: user.id
      });

    if (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error creating post",
        description: "There was an error creating your post",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Post created successfully",
        description: "Your post has been published"
      });
      setNewPost({ subject: "", content: "", category_id: "" });
      setIsCreatePostOpen(false);
      fetchPosts();
    }
  };

  const createComment = async () => {
    if (!user || !selectedPost || !newComment.trim()) {
      return;
    }

    const { error } = await supabase
      .from('forum_comments')
      .insert({
        comment_text: newComment,
        post_id: selectedPost.id,
        user_id: user.id
      });

    if (error) {
      console.error('Error creating comment:', error);
      toast({
        title: "Error creating comment",
        description: "There was an error posting your comment",
        variant: "destructive"
      });
    } else {
      setNewComment("");
      fetchComments(selectedPost.id);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedPost) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedPost(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Forums
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{selectedPost.subject}</CardTitle>
            <CardDescription className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {selectedPost.users?.full_name || selectedPost.users?.email || 'Anonymous'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(selectedPost.created_at).toLocaleDateString()}
              </span>
              <Badge variant="secondary">
                {selectedPost.forum_categories?.name}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{selectedPost.content}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comments ({comments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Write your comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button onClick={createComment} disabled={!newComment.trim()}>
                  Post Comment
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="border-l-4 border-blue-200 pl-4 py-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <User className="w-3 h-3" />
                    {comment.users?.full_name || comment.users?.email || 'Anonymous'}
                    <span>•</span>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </div>
                  <p className="whitespace-pre-wrap">{comment.comment_text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Discussion Forums</h1>
          <p className="text-muted-foreground">Connect with fellow students and share knowledge</p>
        </div>
        <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
              <DialogDescription>
                Share your thoughts with the community
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={newPost.subject}
                  onChange={(e) => setNewPost(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Post subject"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select onValueChange={(value) => setNewPost(prev => ({ ...prev, category_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
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
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your post content..."
                  rows={4}
                />
              </div>

              <Button onClick={createPost} className="w-full">
                Create Post
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search posts..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={(value) => {
              setSelectedCategory(value);
              setTimeout(() => fetchPosts(), 100);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No posts found</h3>
              <p className="text-gray-500 mb-6">
                Be the first to start a discussion in this category
              </p>
              <Button 
                onClick={() => setIsCreatePostOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map(post => (
            <Card 
              key={post.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedPost(post)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{post.subject}</CardTitle>
                  <Badge variant="secondary">
                    {post.forum_categories?.name}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {post.users?.full_name || post.users?.email || 'Anonymous'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </CardDescription>
              </CardHeader>
              {post.content && (
                <CardContent>
                  <p className="text-gray-600 line-clamp-2">
                    {post.content.length > 150 
                      ? `${post.content.substring(0, 150)}...` 
                      : post.content}
                  </p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Forums;
