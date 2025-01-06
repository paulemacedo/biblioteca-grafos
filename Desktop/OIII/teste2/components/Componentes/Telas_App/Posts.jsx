import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';

const PostScreen = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [newComment, setNewComment] = useState('');

  const handlePublishPost = () => {
    if (newPost.trim() !== '') {
      setPosts([...posts, { id: Date.now().toString(), text: newPost, comments: [] }]);
      setNewPost('');
    }
  };

  const handleAddComment = (postId) => {
    if (newComment.trim() !== '') {
      const updatedPosts = posts.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, { id: Date.now().toString(), text: newComment }] }
          : post
      );
      setPosts(updatedPosts);
      setNewComment('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.postInput}>
        <TextInput
          style={styles.input}
          placeholder="Write a new post..."
          value={newPost}
          onChangeText={setNewPost}
          multiline
        />
        <TouchableOpacity style={styles.publishButton} onPress={handlePublishPost}>
          <Text style={styles.publishButtonText}>Publish</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postContainer}>
            <Text style={styles.postText}>{item.text}</Text>

            <View style={styles.commentInput}>
              <TextInput
                style={styles.input}
                placeholder="Write a comment..."
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity
                style={styles.commentButton}
                onPress={() => handleAddComment(item.id)}
              >
                <Text style={styles.commentButtonText}>Comment</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={item.comments}
              keyExtractor={(comment) => comment.id}
              renderItem={({ item: comment }) => (
                <View style={styles.commentContainer}>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              )}
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  postInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
  },
  publishButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 10,
  },
  publishButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  postContainer: {
    backgroundColor: '#f1f1f1',
    padding: 16,
    borderRadius: 4,
    marginBottom: 16,
  },
  postText: {
    fontSize: 16,
    marginBottom: 10,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 10,
  },
  commentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  commentContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
  },
});

export default PostScreen;