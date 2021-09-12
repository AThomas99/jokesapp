const AUTH0_CLIENT_ID = "WIzaEeIKio8uTYCqie3Qn2BawjudRAvN";
const AUTH0_DOMAIN = "dev-6nmbzsne.us.auth0.com";
const AUTH0_CALLBACK_URL = location.href;
const AUTH0_API_AUDIENCE = "JokesApp";


class App extends React.Component{
    parseHash(){
        this.auth0 = new auth0.WebAuth({
            domain: AUTH0_DOMAIN,
            clientID: AUTH0_CLIENT_ID
        });
        this.auth0.parseHash(window.location.hash, (err, authResult) => {
            if (err) {
                return console.log(err);
            }
            if (authResult !== null && authResult.accessToken !== null && authResult.idToken !== null){
                localStorage.setItem("access_token", authResult.accessToken);
                localStorage.setItem("id_token", authResult.idToken);
                localStorage.setItem("profile", JSON.stringify(authResult.idTokenPayload));
                window.location = window.location.href.substr(0,window.location.href.indexOf("#"));
            }
        });
    }

    setup(){
        $.ajaxSetup({
            beforeSend: (r) => {
                if (localStorage.getItem("access_token")) {
                    r.setRequestHeader(
                        "Authorization",
                        "Bearer " + localStorage.getItem("access_token")
                    );
                }
            }
        });
    }


    setState(){
        let idToken = localStorage.getItem("id_token");
        if(idToken) {
            this.loggedIn = True
        } else {
            this.loggedIn = False
        }
    }

    componentDidMount(){
        this.setup();
        this.parseHash();
        this.setState();
    }

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

    constructor(props){
        super(props);
        this.authenticate = this.authenticate.bind(this);
    }

    authenticate (){
        this.WebAuth = new auth0.WebAuth({
            domain: AUTH0_DOMAIN,
            clientID: AUTH0_CLIENT_ID,
            scope: "openid profile",
            audience: AUTH0_API_AUDIENCE,
            resposeType: "token id_token",
            redirectUri: AUTH0_CALLBACK_URL
        });
        this.WebAuth.authorize();
    }
    
    render(){
        return(
            <div className="container">
                <div className="row">
                    <div className="col-xl-6 col-offset-2 jumbotron text-center">
                        <h1>Jokeish Application</h1>
                        <p>For when you need the laughs to come fast.</p>
                        <p>Sign in to get accesss</p>
                        <a onClick={this.authenticate} className="btn btn-primary btn-lg btn-login btn-block">Sign In</a>
                    </div>
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
        };

        this.serverRequest = this.serverRequest.bind(this);
        this.logout = this.logout.bind(this);
    }

    logout(){
        localStorage.removeItem("id_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("profile");
        location.reload();
    }

    serverRequest(){
        $.get("http://localhost:3000/api/jokes", res => {
            this.setState({
                jokes: res
            });
        });
    }

    componentDidMount(){
        this.serverRequest();
    }

    render (){
        return(
            <div className="container">
                <br />
                <span className="pull-right"><a onClick={this.logout}>Log out</a></span>
                <h2>Jokeish</h2>
                <p>Let's feed you with some funny Jokes!!!</p>
                <div className="row">
                    <div className="container">
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
            liked: "",
            jokes: []
        };
        this.like = this.like.bind(this)
        this.serverRequest = this.serverRequest.bind(this);
    }

    like (){
        let joke = this.props.joke;
        this.serverRequest(joke);
    }

    serverRequest(joke){
        $.post("http://localhost:3000/api/jokes/like/" + joke.id, { like: 1 },
            res => {
                console.log("res... ", res);
                this.setState({ liked: "Liked!", jokes: res });
                this.props.jokes = res;
            },
        );
    }
    
    render(){
        return(
            <div className="col-xs-4">
                <div className="panel panel-default">
                    <div className="panel-heading">
                        #{this.props.id}{" "}
                        <span className="pull-right">{this.state.liked}</span>  
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