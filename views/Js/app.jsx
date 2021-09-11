class App extends React.Component{
    render(){
        if (this.loggedIn) {
            return (
                <LoggedIn />
            );
        } else {
            return (
                <Home/>
            );
        }
    }

    
}


class Home extends React.Component {
    
    render(){
        return(
            <div className="container">
                <div className="col-xl-6 col-offset-2 jumbotron text-center">
                    <h1>Jokeish Application</h1>
                    <p>For when you need the laughs to come fast.</p>
                    <p>Sign in to get accesss</p>
                    <a onClick={this.authenticate} className="btn btn-primary btn-lg btn-login btn-block">Sign In</a>
                </div>
            </div>
        );
    }
}

class LoggedIn extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            jokes : []
        }
    }

    render (){
        return(
            <div className="container">
                <div className="col-lg-12">
                    <br />
                    <span className="pull-right"><a onClick={this.logout}>Log out</a></span>
                    <h2>Jokeish</h2>
                    <p>Let's feed you with some funny Jokes!!!</p>
                    <div className="row">
                        {
                            this.state.jokes.map(
                                function(joke, i){
                                    return (
                                        <Joke key={i} joke={joke} />
                                    );
                                }
                            )
                        }
                    </div>
                </div>
            </div>
        );

    }

}

class Joke extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            liked: ""
        }
        this.like = this.like.bind(this)
    }

    like (){
        // Add like functionality later
    }
    
    render(){
        return(
            <div className="col-xs-4">
                <div className="panel panel-default">
                    <div className="panel-header">
                        {this.props.id}
                    </div>
                    <div className="panel-body">
                        {this.props.joke.joke}
                    </div>
                    <div className="panel-footer">
                        {this.props.joke.likes} Likes &nbsp;
                        <a onClick={this.like} className="btn btn-default">
                            <span className="glyphicon glyphicon-thumbs-up"></span>
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}


ReactDOM.render(<App />, document.getElementById('app'));